import { Teacher, CrcProfile, ClusterSchool, SelectedTeacherInOrder } from '../types';

export interface OrderDraftResult {
  assistantReply: string;
  orderDraft: {
    subject: string;
    reference?: string;
    orderType: 'meeting' | 'duty' | 'training' | 'general' | 'notice';
    content: string;
    includeDeputedSchool?: boolean;
    selectedTeachers: SelectedTeacherInOrder[];
    meetingDate?: string;
    meetingTime?: string;
    meetingVenue?: string;
  };
}

export function generateSmartLocalDraft(
  prompt: string,
  teachers: Teacher[],
  profile: CrcProfile,
  schools: ClusterSchool[]
): OrderDraftResult {
  const p = prompt.toLowerCase();
  const rawPrompt = prompt.trim();

  // Determine order type
  let orderType: 'meeting' | 'duty' | 'training' | 'general' | 'notice' = 'general';
  let isDeputationOrExam = false;

  if (p.includes('बैठक') || p.includes('meeting') || p.includes('समीक्षा')) {
    orderType = 'meeting';
  } else if (p.includes('प्रशिक्षण') || p.includes('training') || p.includes('fln') || p.includes('निपुण') || p.includes('कार्यशाला')) {
    orderType = 'training';
  } else if (p.includes('कारण बताओ') || p.includes('स्पष्टीकरण') || p.includes('अनुपस्थित') || p.includes('notice') || p.includes('चेतावनी')) {
    orderType = 'notice';
  } else if (
    p.includes('वीक्षक') || p.includes('परीक्षा') || p.includes('मूल्यांकन') || 
    p.includes('duty') || p.includes('प्रतिनियुक्ति') || p.includes('प्रतिनियुक्त') || 
    p.includes('deputation') || p.includes('जांच') || p.includes('खेलकूद') || p.includes('निगरानी')
  ) {
    orderType = 'duty';
    isDeputationOrExam = true;
  }

  // Extract date if mentioned (e.g. 26 मार्च, 28 तारीख, 15/04/2026, 2026-03-25)
  let extractedDate = '';
  const dateMatch = rawPrompt.match(/(\d{1,2}\s*(?:जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|अक्टूबर|नवंबर|दिसंबर|तारीख|\/\d{1,2}\/\d{2,4}|-\d{1,2}-\d{2,4}))/i);
  if (dateMatch) {
    extractedDate = dateMatch[0];
  } else {
    const today = new Date();
    today.setDate(today.getDate() + 2);
    extractedDate = today.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Extract time if mentioned
  let extractedTime = '';
  const timeMatch = rawPrompt.match(/(\d{1,2}(?::\d{2})?\s*(?:बजे|am|pm|प्रातः|दोपहर|अपराह्न))/i);
  if (timeMatch) {
    extractedTime = timeMatch[0];
  } else if (orderType === 'meeting' || orderType === 'training') {
    extractedTime = 'प्रातः 11:00 बजे';
  }

  // Extract venue if mentioned
  let extractedVenue = '';
  const venueMatch = rawPrompt.match(/(?:में|पर|स्थान)\s*([^\s,।\n]+(?:सभागार|कक्ष|विद्यालय|केंद्र|भवन|शाला))/i);
  if (venueMatch) {
    extractedVenue = venueMatch[1];
  } else {
    extractedVenue = `${profile.clusterName || 'संकुल संसाधन केंद्र'} सभागार / मुख्य कक्ष`;
  }

  // Extract target deputed school / center if mentioned
  let targetDeputedSchool = '';
  if (schools.length > 0) {
    const foundSchool = schools.find(s => rawPrompt.includes(s.name));
    if (foundSchool) {
      targetDeputedSchool = foundSchool.name;
    }
  }
  if (!targetDeputedSchool) {
    const schoolNameMatch = rawPrompt.match(/([^\s,।\n]+(?:विद्यालय|शाला|हायर सेकेंडरी|हाईस्कूल|केंद्र))/i);
    if (schoolNameMatch) {
      targetDeputedSchool = schoolNameMatch[1];
    } else if (isDeputationOrExam) {
      targetDeputedSchool = profile.clusterName || 'शासकीय उच्चतर माध्यमिक विद्यालय संकुल केंद्र';
    }
  }

  // How many teachers requested? (e.g. 4 शिक्षकों, 2 शिक्षक, 5)
  let teacherCount = 3;
  const countMatch = rawPrompt.match(/(\d+)\s*(?:शिक्षक|शिक्षिका|teachers)/i);
  if (countMatch) {
    teacherCount = Math.min(Math.max(parseInt(countMatch[1], 10), 1), teachers.length || 10);
  }

  // Select teachers
  let selectedTeachers: SelectedTeacherInOrder[] = [];

  // Check if specific teacher names were provided in prompt
  const matchedTeachers = teachers.filter(t => rawPrompt.includes(t.name));
  if (matchedTeachers.length > 0) {
    selectedTeachers = matchedTeachers.map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation || 'सहायक शिक्षक',
      schoolName: t.schoolName || 'शासकीय प्राथमिक शाला',
      deputedSchool: targetDeputedSchool || t.schoolName,
      assignedDutyRole: orderType === 'duty' ? (p.includes('मूल्यांकन') ? 'मूल्यांकनकर्ता' : 'वीक्षक / पर्यवेक्षक') : 'उपस्थिति एवं दायित्व निर्वहन',
    }));
  } else if (teachers.length > 0) {
    selectedTeachers = teachers.slice(0, teacherCount).map(t => ({
      id: t.id,
      name: t.name,
      designation: t.designation || 'सहायक शिक्षक',
      schoolName: t.schoolName || 'शासकीय प्राथमिक शाला',
      deputedSchool: isDeputationOrExam ? targetDeputedSchool : undefined,
      assignedDutyRole: orderType === 'duty' ? (p.includes('मूल्यांकन') ? 'मूल्यांकनकर्ता' : 'वीक्षक (कक्ष निरीक्षक)') : 'सक्रिय सहभागिता',
    }));
  } else {
    // If no teachers registered yet, provide high quality placeholder list
    const sampleNames = ['श्री रमेश कुमार शर्मा', 'श्रीमती सीमा वर्मा', 'श्री आलोक सिंह', 'श्रीमती नीता पटेल'];
    selectedTeachers = sampleNames.slice(0, teacherCount).map((name, idx) => ({
      id: `sample-${idx + 1}`,
      name,
      designation: idx % 2 === 0 ? 'सहायक शिक्षक (एल.बी.)' : 'शिक्षक (माध्यमिक शाला)',
      schoolName: `शासकीय प्राथमिक शाला, वार्ड क्रमांक ${idx + 1}`,
      deputedSchool: isDeputationOrExam ? targetDeputedSchool : undefined,
      assignedDutyRole: orderType === 'duty' ? 'वीक्षक (कक्ष निरीक्षक)' : 'दायित्व निर्वहन',
    }));
  }

  // Generate subject, reference, and content based on type
  let subject = '';
  let reference = `कार्यालय जिला शिक्षा अधिकारी / विकासखंड शिक्षा अधिकारी, पत्र क्रमांक/गोपनीय/2026/1042 दिनांक ${new Date().toLocaleDateString('hi-IN')}`;
  let content = '';
  let assistantReply = '';

  const block = profile.blockName || 'विकासखंड';
  const district = profile.districtName || 'जिला';

  if (orderType === 'duty') {
    if (p.includes('मूल्यांकन') || p.includes('उत्तरपुस्तिका')) {
      subject = `अर्धवार्षिक / वार्षिक परीक्षा उत्तरपुस्तिका मूल्यांकन कार्य हेतु शिक्षकों की प्रतिनियुक्ति बाबत।`;
      content = `उपरोक्तानुसार विषयान्तर्गत संदर्भित पत्र के परिप्रेक्ष्य में लेख है कि संकुल संसाधन केंद्र अंतर्गत आयोजित परीक्षा की उत्तरपुस्तिकाओं के निष्पक्ष, पारदर्शी एवं समयबद्ध मूल्यांकन कार्य हेतु नीचे तालिका में अंकित शिक्षकों को प्रतिनियुक्त किया जाता है।\n\nउक्त सभी आदेशित शिक्षक दिनांक ${extractedDate} को समय ${extractedTime || 'प्रातः 10:30 बजे'} मूल्यांकन केंद्र ${targetDeputedSchool} में अनिवार्य रूप से अपनी उपस्थिति दर्ज कराकर मूल्यांकन कार्य पूर्ण कराना सुनिश्चित करें।\n\nकार्य में किसी भी प्रकार की लापरवाही या अनुपस्थिति को अनुशासनहीनता मानते हुए उच्चाधिकारियों को अनुशासनात्मक कार्रवाई हेतु प्रतिवेदित किया जाएगा।`;
      assistantReply = `उत्तरपुस्तिका मूल्यांकन ड्यूटी आदेश तैयार कर दिया गया है। इसमें सभी शिक्षकों के नाम, मूल शाला व मूल्यांकन केंद्र का स्पष्ट उल्लेख है।`;
    } else {
      subject = `वार्षिक / बोर्ड परीक्षा सुचारू एवं शांतिपूर्ण संचालन हेतु वीक्षक (Invigilator) ड्यूटी आदेश।`;
      content = `उपरोक्तानुसार विषयान्तर्गत संदर्भित पत्र के अनुक्रम में छात्र-छात्राओं के हित एवं परीक्षा की शुचिता बनाए रखने के उद्देश्य से निम्नलिखित शिक्षकों को परीक्षा केंद्र: ${targetDeputedSchool} में वीक्षक / पर्यवेक्षक के रूप में प्रतिनियुक्त किया जाता है।\n\nनिर्देश:\n1. समस्त वीक्षक परीक्षा दिवस दिनांक ${extractedDate} को परीक्षा प्रारंभ होने से 45 मिनट पूर्व केंद्र पर अनिवार्य रूप से उपस्थिति दर्ज करावें।\n2. परीक्षा केंद्र में मोबाइल फोन अथवा अन्य इलेक्ट्रॉनिक उपकरण पूर्णतः प्रतिबंधित रहेगा।\n3. परीक्षा संचालन में किसी भी प्रकार की शिथिलता अक्षम्य होगी तथा इसका व्यक्तिगत दायित्व संबंधित वीक्षक का होगा।`;
      assistantReply = `परीक्षा वीक्षक (Invigilator) ड्यूटी आदेश शासकीय प्रारूप में तैयार कर दिया गया है।`;
    }
  } else if (orderType === 'meeting') {
    subject = `संकुल स्तरीय मासिक समीक्षा बैठक में प्रधान पाठकों / शिक्षकों की अनिवार्य उपस्थिति बाबत।`;
    content = `एतद्द्वारा संकुल अंतर्गत समस्त शासकीय प्राथमिक एवं पूर्व माध्यमिक शालाओं के प्रधान पाठकों एवं संबंधित शिक्षकों को सूचित किया जाता है कि शैक्षणिक गुणवत्ता, विभागीय योजनाओं की प्रगति एवं विद्यार्थियों की शत-प्रतिशत उपस्थिति की समीक्षा हेतु संकुल स्तरीय आवश्यक बैठक आयोजित की गई है।\n\nबैठक का विवरण:\n• नियत दिनांक: ${extractedDate}\n• समय: ${extractedTime}\n• स्थान: ${extractedVenue}\n\nएजेंडा बिंदु:\n1. छात्र उपस्थिति एवं मध्याह्न भोजन (MDM) की दैनिक प्रविष्टि।\n2. निपुण भारत / FLN लक्ष्यों की शालावार प्रगति समीक्षा।\n3. छात्रवृत्ति एवं सरकारी योजनाओं के पोर्टल वेरिफिकेशन की स्थिति।\n\nनोट: बैठक में अद्यतन अभिलेखों (Registers) सहित समय पर उपस्थित होना अनिवार्य है। बिना पूर्व सूचना अनुपस्थित रहने पर नियमानुसार कार्रवाई की जाएगी।`;
    assistantReply = `संकुल मासिक समीक्षा बैठक का आधिकारिक आदेश तैयार कर दिया गया है।`;
  } else if (orderType === 'training') {
    subject = `निपुण भारत मिशन / FLN शिक्षक प्रशिक्षण कार्यशाला में अनिवार्य उपस्थिति बाबत।`;
    content = `उपरोक्तानुसार विषयान्तर्गत लेख है कि प्राथमिक कक्षाओं में भाषाई दक्षता एवं बुनियादी संख्याज्ञान संवर्धन हेतु संकुल स्तरीय विशेष शिक्षक प्रशिक्षण कार्यशाला का आयोजन नियत किया गया है।\n\nउक्त प्रशिक्षण में नीचे सूची में अंकित शिक्षकों को प्रशिक्षणार्थी के रूप में नामांकित किया जाता है।\n\nकार्यशाला विवरण:\n• दिनांक: ${extractedDate}\n• समय: ${extractedTime || 'प्रातः 10:00 बजे से सायं 04:30 बजे तक'}\n• प्रशिक्षण स्थल: ${extractedVenue}\n\nउक्त प्रशिक्षण पूर्णतः अनिवार्य है। समस्त नामित शिक्षक समय पर उपस्थित होकर प्रशिक्षण में सक्रिय सहभागिता सुनिश्चित करें। प्रशिक्षण उपरांत अपनी उपस्थिति प्रमाण पत्र संकुल कार्यालय में जमा करना सुनिश्चित करेंगे।`;
    assistantReply = `FLN / निपुण भारत शिक्षक प्रशिक्षण आदेश शुद्ध शासकीय प्रारूप में तैयार हो गया है।`;
  } else if (orderType === 'notice') {
    subject = `शाला में अनाधिकृत अनुपस्थिति / शासकीय कार्य में शिथिलता के संबंध में कारण बताओ सूचना (Show Cause Notice)।`;
    content = `कार्यालयीन आकस्मिक निरीक्षण एवं शाला पंजी के अवलोकन उपरांत यह संज्ञान में आया है कि आप बिना किसी पूर्व सूचना अथवा सक्षम अधिकारी की स्वीकृति के अपने पदीय कर्तव्यों से अनुपस्थित पाए गए, जो कि सिविल सेवा आचरण नियमों के पूर्णतः विपरीत एवं घोर अनुशासनहीनता का द्योतक है।\n\nअतः आपको निर्देशित किया जाता है कि इस पत्र प्राप्ति के 3 (तीन) कार्यदिवस के भीतर अपना समाधानकारक एवं साक्ष्ययुक्त स्पष्टीकरण संकुल प्राचार्य / समन्वयक के समक्ष व्यक्तिगत रूप से प्रस्तुत करें।\n\nसमयावधि में समाधानकारक उत्तर प्राप्त न होने की दशा में यह मान लिया जाएगा कि आपको अपने पक्ष में कुछ नहीं कहना है और आपके विरुद्ध अनुशासनात्मक कार्रवाई हेतु उच्चाधिकारियों (BEO / DEO) को प्रस्ताव प्रेषित कर दिया जाएगा।`;
    assistantReply = `कारण बताओ नोटिस (Show Cause Notice) का प्रारूप तैयार कर दिया गया है।`;
  } else {
    // General order
    subject = `${rawPrompt.length > 50 ? rawPrompt.substring(0, 48) + '...' : rawPrompt} के संबंध में आवश्यक निर्देश बाबत।`;
    content = `उपरोक्तानुसार विषयान्तर्गत सर्वसंबंधित को निर्देशित किया जाता है कि संकुल क्षेत्र अंतर्गत विभागीय कार्यों के सुचारू संचालन एवं अनुशासन संधारण हेतु दिए गए निर्देशों का कड़ाई से अनुपालन किया जाना सुनिश्चित करें।\n\n1. समस्त संबंधित शिक्षक/कर्मचारी सौंपे गए पदीय दायित्वों का निष्ठापूर्वक एवं समय-सीमा में निर्वहन करेंगे।\n2. विद्यार्थियों के शैक्षणिक स्तर उन्नयन एवं शाला के नियमित संचालन में किसी भी प्रकार की शिथिलता न बरती जाए।\n3. उक्त आदेश तत्काल प्रभाव से लागू होगा।`;
    assistantReply = `आपके दिए गए विवरण के आधार पर शासकीय कार्यालयीन आदेश तैयार कर दिया गया है।`;
  }

  return {
    assistantReply: `🙏 ${assistantReply}\n\nआप नीचे दिए गए **"आदेश फॉर्म में लोड करें (Apply)"** बटन पर क्लिक करके इसे सीधे मुख्य आदेश पत्र में ट्रांसफर कर सकते हैं और प्रिंट/डाउनलोड कर सकते हैं।`,
    orderDraft: {
      subject,
      reference,
      orderType,
      content,
      includeDeputedSchool: isDeputationOrExam,
      selectedTeachers,
      meetingDate: extractedDate,
      meetingTime: extractedTime,
      meetingVenue: extractedVenue,
    }
  };
}
