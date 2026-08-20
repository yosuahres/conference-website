export const event = {
  shortName: "ISPhOA",
  edition: "2026",
  fullName: "International Seminar on Photonics, Optics, and its Applications",
  theme: "AI-driven Light-based Technology Innovations",
  dates: "2–3 December 2026",
  datesShort: "2–3 Dec 2026",
  venue: "UIN Mahmud Yunus Batusangkar",
  city: "Batusangkar",
  region: "West Sumatra",
  country: "Indonesia",
  locality: "BATUSANGKAR · WEST SUMATRA",
  format: "Hybrid: On-site & Online (Zoom)",
  email: "secretariat@isphoa2026.org",
  website: "https://isphoa2026.org",
  startsAt: "2026-12-02T08:00:00+07:00",
  endsAt: "2026-12-03T17:00:00+07:00",
} as const;

export const brand = {
  logo: "/brand/logo-circle.jpeg",
  logoWidth: 1600,
  logoHeight: 1600,
  logoMain: "/brand/logo-main.png",
  logoMainWidth: 6249,
  logoMainHeight: 2640,
} as const;

export const submissionWindow = {
  opensAt: "2026-06-01T00:00:00+07:00",
  closesAt: "2026-09-15T23:59:59+07:00",
  opensDisplay: "01 Jun 2026",
} as const;

export const earlyBirdUntil = "2026-11-01T23:59:59+07:00";

export const keyDates = [
  {
    n: "01",
    label: "Full-paper Submission (max 6 pages) for Review",
    iso: submissionWindow.closesAt,
    display: "15 Sep 2026",
  },
  {
    n: "02",
    label: "Notification of Acceptance",
    iso: "2026-10-15T00:00:00+07:00",
    display: "15 Oct 2026",
  },
  {
    n: "03",
    label: "Early-bird Registration",
    iso: earlyBirdUntil,
    display: "01 Nov 2026",
  },
  {
    n: "04",
    label: "Camera-ready Full Paper Submission",
    iso: "2026-11-20T23:59:59+07:00",
    display: "20 Nov 2026",
  },
  {
    n: "05",
    label: "Seminar Program",
    iso: event.startsAt,
    display: "2–3 Dec 2026",
  },
] as const;

export const keyDateGroups = [
  {
    heading: "Submission",
    dates: [keyDates[0], keyDates[1], keyDates[3]],
  },
  {
    heading: "Registration",
    dates: [keyDates[2], keyDates[4]],
  },
] as const;

export const nav = [
  { label: "Home", href: "/" },
  { label: "Committee", href: "/committee" },
  { label: "Venue", href: "/venue" },
  {
    // No href; this one only opens its dropdown.
    label: "Programme",
    children: [
      { label: "Important Dates", href: "/important-dates" },
      { label: "Speakers", href: "/speakers" },
    ],
  },
  {
    // No href; this one only opens its dropdown.
    label: "Authors",
    children: [
      { label: "Call for Papers", href: "/call-for-papers" },
      { label: "Submission", href: "/submission" },
    ],
  },
] as const;

type Para = readonly (string | { readonly em: string })[];

export const about = {
  heading: `About ${event.shortName} ${event.edition}`,
  paragraphs: [
    [
      "The ",
      {
        em: `${event.fullName} (${event.shortName})`,
      },
      " is a biennial scientific program that first began in 2014. The first ISPhOA was held on ",
      { em: "October 14–15, 2014, in Sanur, Bali" },
      ", and continued with successive seminars on ",
      { em: "August 24–25, 2016, in Kuta, Bali" },
      ", and on ",
      { em: "August 1–2, 2018, in Surabaya" },
      ". Due to the worldwide spread of the COVID-19 pandemic, the 4th ISPhOA was held in full online mode on ",
      { em: "December 1–2, 2020" },
      ", and then also the subsequent 5th ISPhOA on ",
      { em: "November 29–30, 2022" },
      ". After a hiatus in 2024, the 6th ISPhOA is now scheduled to be held on ",
      { em: `December 2–3, 2026, in ${event.city}, ${event.region}` },
      ".",
    ],
    [
      "Since its establishment, ISPhOA has been dedicated and aimed as a scientific forum to bring together leading national and international researchers, engineers, and practitioners that are interested in developing innovations in any of the ",
      { em: "light-based-related technologies" },
      ". The seminar offers plenary, keynote, and invited talks given by prominent researchers in the related topics on photonics and optics, as well as contributed oral and poster presentations, special sessions, and exhibitions of commercial products. Participants will also engage in social and cultural events to foster informal networking talks in a friendly setting.",
    ],
    [
      "This year ISPhOA 2026 will feature the theme of ",
      { em: "AI-driven light-based technology innovations" },
      ", and it is envisioned as a platform for generating innovative ideas by leveraging advancements in ",
      { em: "artificial intelligence (AI)" },
      " technology. We expect these AI advancements to spur new innovations in light-based technology that will address various societal challenges.",
    ],
  ] as readonly Para[],
  eyebrow: "About the Seminar",
  titleLead: "The Future of Light",
  titleTail: "Starts Here",
  bodyOne: {
    before:
      "ISPhOA 2026 continues a proud tradition of uniting the global photonics and optics community. This edition convenes in ",
    emphasis: "Batusangkar, West Sumatra",
    after:
      ", the historic heartland of Minangkabau civilization, offering a uniquely Indonesian backdrop for world-class scientific exchange.",
  },
  bodyTwo:
    "The seminar bridges fundamental research and translational innovation, connecting academia with industry to accelerate adoption of photonic technologies across energy, healthcare, communications, and sustainable development.",
  facts: [
    { icon: "pin", text: `${event.venue}, ${event.region}, ${event.country}` },
    { icon: "calendar", text: event.dates },
    { icon: "globe", text: event.format },
    { icon: "users", text: "600+ Participants from 25+ Countries" },
  ],
  quote:
    "We invite researchers and engineers worldwide to join us for a seminar dedicated to the science of light, in the heart of Minangkabau.",
  quoteAttribution: "ORGANIZING COMMITTEE CHAIR · ISPhOA 2026",
} as const;

export const plenarySpeakers = [
  {
    slug: "brian-yuliarto",
    name: "Prof. Brian Yuliarto, S.T., M.Eng., Ph.D.",
    role: "Plenary",
    institution:
      "Minister of Higher Education, Science and Technology · Bandung Institute of Technology, Indonesia",
    topic: null,
    photo: "/photos/speakers/plenary/Picture1.jpg",
    bio: [
      "He is a Professor in advanced functional materials, specialized in nanomaterials and biosensors, from the Bandung Institute of Technology. He graduated in 1999 from the Department of Engineering Physics ITB, and earned his M.Sc. (2002) and Ph.D. (2005) in Quantum Engineering and System Science from the University of Tokyo, Japan. His research focuses on the development of nanotechnology-based sensors for detecting hazardous gases, environmental pollutants, and diagnosing diseases like cancer, hepatitis, and dengue fever. He has authored over 326 publications in international journals indexed by Scopus, with an h-index of 43. He received the Habibie Prize in 2024, a recognition as the top researcher in Nanoscience & Nanotechnology in Indonesia in 2023, and was listed among the world's top 2% of scientists in 2024. He was named the best researcher at ITB in 2021 and received the outstanding lecturer award in Science and Technology at ITB in 2017.",
      "Since 2025, he has been appointed as Minister of Higher Education, Science, and Technology. Previously he served as the Vice Rector of Research and Innovation, as the Dean of the Faculty of Industrial Technology, and as the Head of the Engineering Physics Department of the Bandung Institute of Technology.",
    ] as readonly string[],
  },
] as const;

export const speakers = [
  {
    slug: "hatta",
    name: "Prof. Agus Muhamad Hatta, S.T., M.Si., Ph.D.",
    role: "Keynote",
    institution:
      "Institut Teknologi Sepuluh Nopember · President of the Indonesia Optical Society (InOS)",
    topic: null,
    photo: "/photos/speakers/hatta.jpeg",
    bio: [
      "Prof. Agus Muhamad Hatta is Professor of Engineering Physics at the Institut Teknologi Sepuluh Nopember (ITS), Surabaya, where he currently serves as Vice Rector for Research, Innovation, Collaboration, and Alumni Relations.",
      "He finished his undergraduate (S.T., equivalent to B.Eng) and his Master's at ITS, and earned his Ph.D. (2010) from the Photonics Research Centre, Technological University Dublin, Ireland.",
      "As a member of the Photonic Engineering Laboratory, his research focuses on fiber-optic sensing, integrated optics, optical and photonic sensors, and quantum optics, with numerous contributions to optical fiber sensing technologies and photonic devices. He has published extensively in leading international journals and is widely recognized as one of Indonesia's prominent photonics researchers.",
      "He currently also serves as the President of the Indonesia Optical Society (InOS).",
    ] as readonly string[],
  },
  {
    slug: "ganapathy",
    name: "Prof. Senthil Murugan Ganapathy",
    role: "Keynote",
    institution: "University Southampton, UK",
    topic: null,
    photo: "/photos/speakers/keynotes/Picture3.jpg",
    bio: [
      "Prof. Senthil Murugan Ganapathy received his Ph.D. (Photonic Materials) in 2001 from the Indian Institute of Science, Bangalore. He worked as a post-doctoral fellow from 2001 to 2005 at the University of Bordeaux, France, and the Toyota Technological Institute, Japan. He joined the Optoelectronics Research Centre at the University of Southampton in April 2005, where he is currently a Professor and Head of the Integrated Photonic Devices Group, and Deputy Head of School (ORC) for Education. He is also an Adjunct Professor at the Indian Institute of Technology Madras, Chennai, India.",
      "His expertise and research interests range from photonic materials to photonic systems, with a current focus on Mid-IR/high-contrast materials and devices for biomedical sensing, on-chip spectroscopy, on-chip nanoscopy, environmental monitoring and optical communication applications. He has made pioneering contributions in the field of novel optical micro-resonators.",
    ] as readonly string[],
  },
  {
    slug: "azhar-zam",
    name: "Assoc. Prof. Azhar Zam, Ph.D.",
    role: "Keynote",
    institution: "NYU Abu Dhabi, UAE",
    topic: null,
    photo: "/photos/speakers/keynotes/Picture4.jpg",
    bio: [
      "Prof. Azhar Zam is an Associate Professor of Bioengineering. He holds a B.S. from the University of Indonesia, an M.Sc. from the University of Luebeck, Germany, and a Ph.D. from Friedrich-Alexander-University Erlangen-Nuremberg, Germany.",
      "Zam's research interests focus on the development of smart devices for medical imaging, diagnostics, and monitoring using novel optical technologies, which include smart laser surgery, optical coherence tomography (OCT), photoacoustics, biomedical spectroscopy, AI-aided optical diagnostics and imaging, optical-based smart biosensors, and miniaturized systems. He has written over 85 peer-reviewed articles and book chapters, and books, and holds several patents.",
      "Before joining NYUAD, Zam was an Assistant Professor in Medical Laser and Optics at the Department of Biomedical Engineering, University of Basel, Switzerland, where he founded the Biomedical Laser and Optics Group (BLOG) and co-established the MIRACLE II flagship project. Prior to that, he held research positions at the University of Waterloo, Waterloo, ON, Canada, the National University of Ireland Galway, Galway, Ireland, the Toronto Metropolitan University (formerly known as Ryerson University), Toronto, ON, Canada, and the University of California at Davis, Davis, CA, USA.",
    ] as readonly string[],
  },
  {
    slug: "kanawade",
    name: "Dr.-Ing. Rajesh Kanawade",
    role: "Keynote",
    institution: "CSIR-National Chemical Laboratory, Pune, India",
    topic: null,
    photo: "/photos/speakers/keynotes/Picture5.jpg",
    bio: [
      "Dr.-Ing. Rajesh Kanawade is the head of the Hydrogen Engineering & Photonics Sensor Group, under the Physical and Materials Chemistry Division, CSIR–National Chemical Laboratory (CSIR-NCL), Pune, India. He obtained his M.Sc. in Physics (2006) from Savitribai Phule Pune University and his Doctor of Engineering (Dr.-Ing.) in 2013 from Friedrich-Alexander University Erlangen–Nürnberg, Germany.",
      "His interdisciplinary research integrates optics, photonics, spectroscopy, biomedical imaging, laser instrumentation, Raman spectroscopy, laser-induced breakdown spectroscopy (LIBS), fiber-optic sensing, and optical diagnostics for healthcare and industrial applications. His work has produced important advances in biomedical spectroscopy and laser-based sensing technologies and has been published in leading journals in photonics and biophotonics.",
    ] as readonly string[],
  },
  {
    slug: "chaompluk",
    name: "Assoc. Prof. Dr. Piyasak Chaumpluk",
    role: "Keynote",
    institution: "UniversityChulalongkorn, Thailand",
    topic: null,
    photo: "/photos/speakers/keynotes/Picture6.jpg",
    bio: [
      "Associate Prof. Dr. Piyasak Chaumpluk is currently a faculty member at the Genetics Program, Department of Botany, Faculty of Science, Chulalongkorn University, where he also serves as the Head of the Laboratory of Plant Transgenic Technology and Biosensor. His research integrates plant science and genetics with cutting-edge biosensor technology to address challenges in agriculture and biosciences.",
      "He finished his B.Sc. at Khon Kaen University, and earned his Master of Agriculture (Plant Pathology) in 1990 and his Doctor of Agriculture (1996), both from Kyoto University. Prior to his current position, he gained valuable international experience as a Researcher at the Iwate Biotechnology Research Center in Japan, where he worked for three years.",
      "His diverse research interests encompass lab-on-a-chip technology, DNA aptamers for novel detection methods, bio/nano sensors for nucleic acid detection in agriculture and biosciences, in vitro cultivation of plants, and enhancing the value of local genetic resources through genetic and biochemical analysis.",
      "For his outstanding contributions to science and innovation, he has received several prestigious international honors, including the United Kingdom Leadership Award (Knight Level) in 2019 and the Brussels Eureka Innova Award (Chevalier Level) in 2016.",
    ] as readonly string[],
  },
  {
    slug: "anto-satriyo-nugroho",
    name: "Prof. Dr. Eng. Anto Satriyo Nugroho",
    role: "Keynote",
    institution: "AI&C RC BRIN, Indonesia",
    topic: null,
    photo: "/photos/speakers/keynotes/Picture13.jpg",
    bio: [
      "Prof. Dr. Eng. Anto Satriyo Nugroho is a Research Professor in Artificial Intelligence and currently is the Head of Research Center for Artificial Intelligence and Cyber Security of the National Research and Innovation Agency (BRIN).",
      "He got his B.Eng (1995), M.Eng. (2000), and Dr.Eng. (2003) in Electrical and Computer Engineering, all were from the Nagoya Institute of Technology. His research interests are devoted to biometrics, pattern recognition, and image processing.",
      "He has authored 84 Scopus-indexed papers, with a current h-index of 12. His Scopus ID is 6701506291 and his ORCID ID is 0000-0002-5457-8786.",
    ] as readonly string[],
  },
] as const;

export const invitedSpeakers = [
  {
    slug: "retna-apsari",
    name: "Prof. Dr. Retna Apsari, M.Si.",
    role: "Invited",
    institution: "Universitas of Airlangga, Indonesia",
    topic: null,
    photo: "/photos/speakers/retna.jpeg",
    bio: [
      "Prof. Retna Apsari graduated in Physics (1991) from Brawijaya University, earned her Master in Physics from Gajah Mada University in 1998, and her Ph.D. in Physics (Laser Biooptics) from the University of Airlangga in 2009. She has authored 127 international papers with a current Scopus h-index of 18, and holds several patents related to diabetes detection systems.",
      "Prof. Retna Apsari is currently appointed as the Dean of the Faculty of Advanced Technology and Multidisciplinary.",
    ] as readonly string[],
  },
  {
    slug: "hery-suyanto",
    name: "Prof. Dr. Hery Suyanto",
    role: "Invited",
    institution: "University of Udayana, Indonesia",
    topic: null,
    photo: "/photos/speakers/invited/Picture8.jpg",
    bio: [
      "Hery Suyanto graduated in Physics from the Institut Teknologi Sepuluh Nopember Surabaya (ITS) in 1988, and earned his Master and Ph.D. (2003) in Optoelectronics from the Faculty of Optoelectronics and Laser Application, the University of Indonesia, Jakarta, Indonesia. In 2019, he was appointed Professor of Optoelectronics and Laser Application at Udayana University.",
      "He has carried out many collaborative research works, mostly at the Maju Makmur Mandiri Research Centre (MMM) in Jakarta, related to numerous applications of LIBS. His research interest focuses on LIBS applications on biomaterial samples such as nail, hair and teeth for biomarkers and pedigree analysis in his laboratory. These works have been published in more than 40 articles in international journals, and some of them are also being proposed as patents.",
    ] as readonly string[],
  },
  {
    slug: "isnaeni",
    name: "Prof. Dr. Isnaeni, M.Sc.",
    role: "Invited",
    institution: "Research Center for Photonics, BRIN, Indonesia",
    topic: null,
    photo: "/photos/speakers/invited/Picture9.jpg",
    bio: [
      "Prof. Isnaeni is a Research Professor in Optics (since 2024) at the National Research and Innovation Agency (BRIN), Indonesia. He graduated in Physics from IPB University, earned his Master's degree in Physics from the University of Queensland in 2006, and his Ph.D. in Physics from the Korea Advanced Institute of Science and Technology, South Korea (2012).",
      "His research interests are in quantum dots, graphene dots and plasmonic nanoparticles, laser spectroscopy, nonlinear optics, metamaterials, and nano-bio-photonics.",
      "He has authored more than 150 international publications during 2010–2026, and currently he is the Head of the Research Center for Photonics of the National Research and Innovation Agency (BRIN).",
    ] as readonly string[],
  },
  {
    slug: "andri-mahendra",
    name: "Andri Mahendra, Ph.D.",
    role: "Invited",
    institution: "Co-Founder and CEO, Nicslab",
    topic: null,
    photo: "/photos/speakers/invited/Picture11.jpg",
    bio: [
      "Andri Mahendra is the Co-Founder and CEO of Nicslab, a deep-tech company developing advanced test and measurement solutions for photonic integrated circuits, semiconductors, and emerging computing technologies. He holds a Ph.D. from the University of Sydney, with a research background in electronics, photonics instrumentation, and control systems. Under his leadership, Nicslab has developed high-density multichannel source-measure and photonic testing technologies used by leading research institutions, semiconductor companies, and government laboratories worldwide.",
      "Andri is actively involved in advancing the semiconductor and photonics ecosystem through technology development, intellectual property, industry collaboration, and international partnerships. He has also contributed to discussions and initiatives focused on strengthening Indonesia's semiconductor and deep-tech ecosystem.",
    ] as readonly string[],
  },
  {
    slug: "ruri-agung-wahyuono",
    name: "Dr. rer. nat. Ruri Agung Wahyuono",
    role: "Invited",
    institution: "Institut Teknologi Sepuluh Nopember, Indonesia",
    topic: null,
    photo: "/photos/speakers/invited/Picture12.jpg",
    bio: [
      "His academic and research expertise centers on advanced functional materials, particularly for energy, environmental, and sensing applications. He leads the ENABLE research group working with the Advanced Functional Materials Laboratory (AFML), which recently became a research-based spin-off company from ITS. ENABLE focuses on innovation in sensor and biosensor technology, smart and functional materials, and sustainable energy systems.",
      "He is an Assistant Professor in the Department of Engineering Physics at Institut Teknologi Sepuluh Nopember (ITS), with an h-index of 17 and 84 Scopus-indexed publications. He currently serves as the Chair of the Graduate Program in Innovation of System and Technology at the School of Interdisciplinary Management and Technology, ITS.",
      "Beyond his academic and industrial roles, he is passionate about community development, particularly in integrating renewable energy systems into smart farming and supporting sustainable production processes for small and medium enterprises. Through these efforts, he actively contributes to bridging research, technology innovation, and real-world societal impact, and was recently awarded an encouragement award by the Hitachi Global Foundation Asia.",
    ] as readonly string[],
  },
  {
    slug: "yulkifli",
    name: "Prof. Dr. Yulkifli, S.Pd., M.Si.",
    role: "Invited",
    institution: "Padang State University, Indonesia",
    topic: null,
    photo: "/photos/speakers/invited/Picture10.jpg",
    bio: [
      "Prof. Yulkifli graduated in Physics Education from IKIP Padang, and earned his Master (2002) and Ph.D. (2010) in Physics from the Bandung Institute of Technology. His fields of expertise are in sensors and sensor systems, physics of instrumentation, and physics education.",
      "He has published numerous international research papers in his fields of expertise, with 83 Scopus-indexed papers and an h-index of 9 (Scopus) and 16 (Google Scholar). His Scopus ID is 36005049600 and his ORCID ID is 0000-0002-0909-6227.",
    ] as readonly string[],
  },
] as const;

export const speakerGroups = [
  { heading: "Plenary Speaker", people: plenarySpeakers },
  { heading: "Keynote Speakers", people: speakers },
  { heading: "Invited Speakers", people: invitedSpeakers },
] as const;

export const tracks = [
  {
    n: "01",
    title: "Halal Authentication Technologies",
    desc: "Optical and photonic methods for non-destructive halal verification, food authentication, and material purity testing.",
  },
  {
    n: "02",
    title: "Life-sciences & Medical Related Technologies",
    desc: "Light-based innovations applied to biomedical diagnostics, therapy, imaging, and life science research.",
  },
  {
    n: "03",
    title: "Agriculture, Livestock, and Fisheries",
    desc: "Optical sensing and photonic systems for precision agriculture, aquaculture monitoring, and livestock management.",
  },
  {
    n: "04",
    title: "Manufacturing and Industries",
    desc: "Laser processing, optical inspection, photonic quality control, and smart manufacturing applications.",
  },
  {
    n: "05",
    title: "Communication & Multimedia",
    desc: "Optical fiber communications, Li-Fi, photonic networks, and light-based multimedia transmission systems.",
  },
  {
    n: "06",
    title: "Energy-related Sectors",
    desc: "Solar energy harvesting, photovoltaics, optical energy storage, and light-driven energy conversion technologies.",
  },
  {
    n: "07",
    title: "Transportation-related Technologies",
    desc: "LiDAR for autonomous vehicles, optical traffic sensing, aerospace photonics, and navigation systems.",
  },
  {
    n: "08",
    title: "Other Light-based Related Innovations",
    desc: "All other original research on light-based technology innovations are also welcome.",
  },
] as const;

export const submission = {
  body: "ISPhOA 2026 welcomes original and unpublished research papers. All submitted full paper (2 to 6 max pages) will undergo double-blind peer review by our reputable reviewers committee. All accepted and presented papers will be published in the Proceeding of SPIE (Scopus Indexed).",
  publisher: {
    logo: "/brand/spie.png",
    indexed: "Scopus Indexed",
    note: "Accepted & Presented Papers",
  },
  policy: [
    {
      title: "SPIE Proceedings",
      desc: "Published in Proceedings of SPIE, Scopus indexed",
    },
    {
      title: "Double-Blind Review",
      desc: "Rigorous peer review by our reputable reviewers committee",
    },
    {
      title: "Full Paper",
      desc: "2 to 6 pages including references, original and unpublished work",
    },
    {
      title: "DOI Assignment",
      desc: "Every accepted and presented paper receives a permanent DOI",
    },
  ],
  formats: [
    "Keynote Lectures",
    "Parallel Sessions",
    "Poster Sessions",
    "Industry Forum",
    "Online Access",
    "Cultural Events",
  ],
} as const;

export const authorDocuments = {
  guidelines: "/documents/ISPhOA-2026-Paper-Submission-Guidelines.docx",
  ethics: "/documents/SPIE-Guidelines-for-Ethical-Publishing.pdf",
  wordTemplate: "/documents/ProcSPIETemplate_Letter.docx",
  samplePdf: "/documents/ProcSPIETemplate_Letter.pdf",
  latexStyle: "/documents/spie-proceedings-style.zip",
} as const;

export const submissionInfo = {
  publication: {
    heading: "Paper Publication",
    lead: "After a careful double-blind review process, all accepted papers, subject to proper registration and presentation at the seminar, will be published in the following proceedings:",
    proceedings: "ISPhOA 2026 Proceedings of SPIE",
    indexing:
      "Proceedings volumes are submitted for evaluation to be indexed in Scopus, Web of Science, Ei Compendex, Inspec, Google Scholar, the Astrophysical Data System (ADS) and Crossref.",
    points: [
      "Manuscripts are officially published after the seminar, and every published paper is archived in the SPIE Digital Library with a permanent DOI.",
      "Only manuscripts presented at the seminar and received according to the guidelines and due dates are published. Papers and posters not presented will not appear in the proceedings.",
      "Chairs and editors may require revision before approving publication, and reserve the right to reject any manuscript that does not meet the standards of a scientific publication. Their decision is final.",
    ],
  },

  plagiarism: {
    heading: "Policy on Plagiarism",
    body: "ISPhOA is utterly intolerant of plagiarism. Submitted papers are expected to contain original work executed by the authors, with adequate, proper and scholarly citation of the work of others, and results are expected to be obtained theoretically or experimentally rather than generated using AI. It is the job of the authors to clearly identify both their own contributions and the published results or techniques on which they depend or build, and to describe the extent of any AI technology used in preparing the manuscript. Reviewers are charged to ensure these standards are met, and the committee reserves the right to reject any paper where the terms of this statement are not honoured.",
  },

  instructions: {
    heading: "Instruction to Authors",
    body: "English is the official language of the seminar, so prepare both the manuscript and the oral presentation in English. Authors are invited to submit a full paper of original, unpublished work in the seminar paper format, including tables, figures and references. Full papers are 2 pages minimum and 6 pages maximum including references, and must be submitted as PDF. The full paper is published in the proceedings and must also be presented at the seminar.",
  },

  templates: {
    heading: "Paper Template",
    lead: "Submitted papers should be formatted according to the following template:",
  },

  method: {
    heading: "Submission Methods",
    intro: "Full papers can be submitted via:",
    options: [
      {
        n: "1",
        label: "Electronic Submission System",
        formats: ".PDF",
        note: "Authors need to log in for submission",
        href: "/dashboard/submissions/new",
      },
      {
        n: "2",
        label: "Seminar Email Box",
        formats: ".PDF/.DOC",
        note: null,
        href: `mailto:${event.email}`,
      },
    ],
    paperId:
      "Paper ID will be assigned by the Seminar Secretariat via the seminar email box within 2 working days.",
    enquiries:
      "Any inquiries about the seminar, please contact the seminar email box:",
  },
  policies: {
    heading: "Review & Publication Policies",
    groups: [
      {
        title: "Review criteria",
        items: [
          "Reviewers verify that every published item is technically sound, contains new and original research content, is non-commercial in nature, includes sufficient technical data to explain the results and support the conclusions, carries adequate and appropriate references, and is clearly and understandably presented.",
          "Privileged information or ideas obtained through review access to abstracts and manuscripts before presentation and publication must be kept confidential and must not be used for competitive gain.",
        ],
      },
      {
        title: "AI tools and authorship",
        items: [
          "Because authorship requires accountability for the submitted work, Large Language Models such as ChatGPT cannot be listed as authors. Authors remain fully responsible for the content of their manuscript, including any part produced by an AI tool.",
          "Disclose any AI tool used, and how it was used, in the Materials and Methods section. Use for language and grammar clean-up should be disclosed in the Acknowledgements.",
          "The use of the Lena (Lenna) image is prohibited. Use another suitable image to illustrate or compare image-processing algorithms.",
        ],
      },
      {
        title: "Presentation, cancelation and no-shows",
        items: [
          "If unforeseeable circumstances prevent you from attending, arrange for a co-author or colleague who is attending to give the presentation. If no substitute presenter is possible, contact the Seminar Secretariat as early as possible to cancel.",
          "Arbitrary cancelation or no-show after the programme has been finalised is recorded in the presenting author's record, and the paper will not be published.",
        ],
      },
      {
        title: "Rights and permissions",
        items: [
          "Authors retain copyright of all scientific material. A Permission to Publish and Distribute Agreement is required, granting the publisher the licence to publish, archive and distribute the paper.",
          "Prior to submission, authors must obtain all clearances, authorizations and licences needed for submission and publication, and all reused work must be properly cited.",
          "Authors and their employers may post an author-prepared or the officially published version on a repository they control, provided the posting is non-commercial, free to users, carries the correct attribution and citation, and links to the DOI of the official version. This does not extend to third-party sites such as ResearchGate, Academia.edu or YouTube.",
        ],
      },
    ],
  },
} as const;

export const templateDownloads = [
  {
    label: "Seminar Proceedings",
    files: [
      { format: "DOC", href: authorDocuments.wordTemplate },
      { format: "LaTeX", href: authorDocuments.latexStyle },
      { format: "PDF Sample", href: authorDocuments.samplePdf },
    ],
  },
  {
    label: "Submission Guidelines",
    files: [{ format: "DOCX", href: authorDocuments.guidelines }],
  },
  {
    label: "Ethical Publishing",
    files: [{ format: "PDF", href: authorDocuments.ethics }],
  },
] as const;

export const registrationNote =
  "All registrations include full seminar access, proceedings, and certificate of participation.";

export const fees = [
  {
    category: "International Presenter",
    earlyBird: "USD 175",
    regular: "USD 220",
    popular: false,
    items: [
      "Oral / Poster Slot",
      "Full 2-day Access",
      "Seminar Kit",
      "Print Proceedings",
      "Certificate",
    ],
  },
  {
    category: "International Participant",
    earlyBird: "USD 240",
    regular: "USD 300",
    popular: true,
    items: [
      "Full 2-day Access",
      "Seminar Kit",
      "Proceedings",
      "Networking Dinner",
      "Cultural Tour",
    ],
  },
  {
    category: "National Presenter",
    earlyBird: "IDR 1,400,000",
    regular: "IDR 1,750,000",
    popular: false,
    items: [
      "Oral / Poster Slot",
      "Full Access",
      "Proceedings",
      "Certificate",
      "DOI Assignment",
    ],
  },
  {
    category: "National Participant",
    earlyBird: "IDR 800,000",
    regular: "IDR 1,000,000",
    popular: false,
    items: ["Full 2-day Access", "Seminar Kit", "Proceedings", "Certificate"],
  },
  {
    category: "Student (National)",
    earlyBird: "IDR 500,000",
    regular: "IDR 650,000",
    popular: false,
    items: ["Full 2-day Access", "Proceedings", "Student Certificate"],
  },
  {
    category: "Online Participant",
    earlyBird: "USD 60",
    regular: "USD 80",
    popular: false,
    items: [
      "Live-stream Access",
      "E-Proceedings",
      "E-Certificate",
      "Virtual Q&A",
      "Recorded Sessions",
    ],
  },
] as const;

export const paymentNote =
  "Payments are processed by Midtrans. Bank transfer, virtual account, QRIS, e-wallet and credit card are all supported. Your registration is confirmed automatically once the payment clears, and a receipt is emailed to you.";

export const programme: {
  day: string;
  items: { time: string; title: string; speaker?: string; room?: string }[];
}[] = [];

export const hostCity = {
  eyebrow: "Host City",
  titleLead: "Batusangkar,",
  titleTail: "West Sumatra",
  body: "The historic seat of the Minangkabau Kingdom. A city where centuries-old traditions, distinctive architecture, and vibrant culture await every visitor.",
  feature: {
    photo: "/photos/pagaruyung.jpg",
    caption: "Istana Basa Pagaruyung, Royal Palace of Minangkabau",
    locality: "BATUSANGKAR, TANAH DATAR · SUMATERA BARAT",
  },
  cards: [
    {
      title: "Pacu Jawi: Traditional Horse Parade",
      sub: "A beloved Minangkabau tradition in Tanah Datar Regency",
    },
    {
      title: "Royal Minangkabau Bridal Attire",
      sub: "The suntiang headdress and gold ceremonial dress",
    },
  ],
  philosophy: {
    label: "Minangkabau Philosophy",
    quote: "Alam Takambang Jadi Guru",
    translation: "Nature is the greatest teacher.",
    body: "The guiding philosophy of the Minangkabau people, and a fitting spirit for a seminar dedicated to the science of light.",
  },
} as const;

export const venue = {
  eyebrow: "Venue",
  name: event.venue,
  addressLines: [
    "Gedung Kuliah Terpadu (GKT), Kampus 2",
    "Jl. Raya Batusangkar - Padang Panjang KM. 7",
    "Nagari Parambahan, Kec. Lima Kaum",
    "Kab. Tanah Datar, Sumatera Barat 27264",
    "Indonesia",
  ],
  // Kept apart from addressLines, which is display copy: schema.org wants the
  // street on its own and the postcode in its own field.
  street: "Jl. Raya Batusangkar - Padang Panjang KM. 7, Parambahan",
  postalCode: "27264",
  mapQuery:
    "Gedung Kuliah Terpadu UIN MY Batusangkar, Jl. Raya Padang Panjang-Batusangkar, Parambahan, Kec. Lima Kaum, Kabupaten Tanah Datar",
  // The embed is driven by coords, not by mapQuery. A text query only pins when
  // Google matches exactly one place, and the university name alone matches two
  // (Campus 1 on Jl. Jenderal Sudirman and this one), which silently drops the
  // embed into multi-result mode with no marker at all. Coordinates always pin.
  // placeId does the same job for the outbound links, which do take text.
  coords: { lat: -0.4635357, lng: 100.5355763 },
  placeId: "ChIJ-1M6EwAt1S8R0cR80CrsL0E",
} as const;

export const gallery = {
  heading: "Previous ISPhOA",
  sub: "ISPhOA 2022 · UNIVERSITAS ANDALAS · PADANG",
  items: [
    { title: "Opening Keynote Session", sub: "Plenary hall, ISPhOA 2022" },
    { title: "Conference Audience", sub: "Full attendance, main auditorium" },
    { title: "Workshop Session", sub: "Hands-on lab, parallel track" },
    { title: "Seminar Proceedings", sub: "Peer review & publication session" },
    { title: "Poster Exhibition", sub: "Research poster session" },
    {
      title: "Networking & Collaboration",
      sub: "Cross-institutional discussion",
    },
  ],
} as const;

/**
 * Transcribed from the committee list supplied by the secretariat. Names are
 * reproduced as given apart from obvious typos; where a working group was
 * listed without a chair, it stays without one rather than promoting someone.
 */
export const committee = {
  patronage: {
    heading: "Patronage",
    entries: [
      "Rector UIN Mahmud Yunus Batusangkar, Tanah Datar, West Sumatera",
      "Rector University of Andalas, Padang, West Sumatera",
      "Rector Institut Teknologi Sepuluh Nopember, Surabaya, Indonesia",
      "Rector University of Airlangga, Surabaya, Indonesia",
      "Rector National University, Jakarta, Indonesia",
    ],
  },

  boards: [
    {
      heading: "Advisory Board",
      chair: "Prof. Agus Muhamad Hatta, S.T., M.Si., Ph.D. (Indonesia)",
      members: [
        "Prof. Delmus Puneri Salim, M.Res., Ph.D. (Indonesia)",
        "Prof. Dr. Mai Efdi, M.Si. (Indonesia)",
        "Prof. Erning Wihardjo (Indonesia)",
        "Dr. Sarun Sumriddetchkajorn (Thailand)",
        "Prof. Senthil Murugan Ganapathy (UK)",
        "Prof. Sulaiman Wadi Harun (Malaysia)",
        "Prof. Sar Sardy (Indonesia)",
        "Prof. Harith Ahmad (Malaysia)",
        "Prof. Parvez Haris (UK)",
        "Prof. Suganda Jutamulia (USA)",
        "Prof. Azzedine Boudrioua (France)",
        "Prof. Joewono Widjaja (Thailand)",
        "Prof. Percival F. Almoro (Philippines)",
      ],
    },
    {
      heading: "Technical Program Committee",
      chair: "Dr.rer.nat. Aulia M. T. Nasution (ITS, Indonesia)",
      members: [
        "Prof. Dr. Yulkifli, M.Si. (UNP, Indonesia)",
        "Prof. Dr. Retna Apsari, M.Si. (UNAIR, Indonesia)",
        "Prof. Dr. Alexander A.P. Iskandar (Bandung Institute of Technology - ITB)",
        "Prof. Dr. Henri Putra Uranus (University of Pelita Harapan - UPH)",
        "Prof. Dr. Hery Suyanto (University of Udayana - UNUD)",
        "Prof. Dr. Isnaeni (National Research and Innovation Agency)",
        "Prof. Dr. Retno Wigajatri (University of Indonesia - UI)",
        "Prof. Dr. Suprijanto (Bandung Institute of Technology - ITB)",
        "Prof. Dr. Husin Alatas (IPB University)",
        "Prof. Dr. Hendradi Hardhienata (IPB University)",
        "Prof. Suryani Dyah Astuti (University of Airlangga - UNAIR)",
        "Prof. Dr. Purnomo Sidi Priambodo (University of Indonesia - UI)",
        "Prof. Dr. P. L. Gareso (Universitas Hasanuddin - UNHAS)",
        "Prof. Dr. Manish Tiwari (Manipal University, Jaipur, India)",
        "Prof. Dr. Pengfei Wang (Shanghai Jiao Tong University, China)",
        "Prof. Dr. Yusuf Nur Wijayanto (National Research and Innovation Agency)",
        "Assoc. Prof. Dr. Mohd Zamani Zulkifli (International Islamic University Malaysia)",
        "Assoc. Prof. Ahmad Fairuz Omar (University of Science Malaysia)",
        "Dr. RongPing Wang (Australian National University)",
        "Dr. Eng. Suryadi Soekardjo (BINUS University)",
        "Dr. Ginu Rajan (Cardiff Metropolitan University)",
        "Dr. Sunish Mathews (University College London)",
        "Dr. Qian Wang (Data Storage Institute, Singapore)",
        "Dr. Ing. Rajesh Kanawade (NCL CSIR, Pune - India)",
        "Dr. Koo Hendrik Kurniawan (Maju Makmur Mandiri Research Center)",
        "Dr. M Danang Birowosuto (University of Prasetya Mulya)",
        "Dr. Maria M. Suliyanti (National Research and Innovation Agency)",
        "Dr. Affi Nur Hidayah (National Research and Innovation Agency)",
        "Dr. Tatas H.P. Brotosudarmo (University of Ciputra)",
        "Dr. G.O.F. Parikesit (University of Gadjah Mada - UGM)",
        "Dr. Eric Jobiliong (University of Pelita Harapan - UPH)",
      ],
    },
  ],

  organizing: {
    heading: "Organizing Committee",
    roles: [
      { role: "General Chair", name: "Dr. Frans Agustiyanto" },
      { role: "Co-Chair", name: "Dr.rer.nat. Maulidanur" },
      { role: "Secretary", name: "Dr. Fitri Rahmah" },
      { role: "Treasurer", name: "Dr. Detak Yan Pratama" },
    ],
  },

  workingGroups: [
    {
      heading: "Secretariat",
      chair: "Dr. Fitri Rahmah, M.T. (UNAS)",
      members: [
        "Sri Maiyena, M.Sc., Ph.D (UIN MY Batusangkar)",
        "Fitria Hidayanti, M.Si (UNAS)",
      ],
    },
    {
      heading: "Sponsorship",
      chair: "Dr. Fadli Ama, M.T. (UNAIR)",
      members: ["Dr. Harmadi (UNAND)", "Dr. Ucuk Darusalam, S.T., M.T. (UNAS)"],
    },
    {
      heading: "Documentation",
      chair: null,
      members: ["Aidhya Irhash Putra, M.P., M.Agr. (UIN MY Batusangkar)"],
    },
    {
      heading: "Program",
      chair: "Dr. Maya Sari, M.Si. (UIN MY Batusangkar)",
      members: [
        "Dr. Ramacos Fardela, M.Sc. (UNAND)",
        "Fidyah Praguna Hayati, S.Si.",
        "Fariska Nurjanah, S.Pd.",
        "Nopitasari, S.Pd.",
        "Bunga",
      ],
    },
    {
      heading: "Proceeding",
      chair: "Ardyas Nur Aufa, S.T., M.T. (ITS)",
      members: [
        "Hadiyati Idrus, M.Sc. (UIN MY Batusangkar)",
        "Dr. Astuti, M.Si. (UNAND)",
        "Rima Zuriah Amdani, M.Sc. (ITS)",
        "Anto (ITS)",
      ],
    },
    {
      heading: "Publicity",
      chair: "Iwan Conny Setiadi, M.T. (ITS)",
      members: [
        "Aldo Novaznursyah Costrada, M.Si. (UNAND)",
        "Raditya Widyadhana (ITS)",
        "Naufaldi Azka (ITS)",
        "Muhammad Baihaqi Ikhsan Kurniawan (ITS)",
      ],
    },
    {
      heading: "Technical",
      chair: "Venny Haris, M.Si., Ph.D (UIN MY Batusangkar)",
      members: [
        "Bushra Hamid, S.Pd. (UIN MY Batusangkar)",
        "Hauliya Rahmah Z., S.Si. (UIN MY Batusangkar)",
        "Habibie (UIN MY Batusangkar)",
        "Rosyid (UIN MY Batusangkar)",
      ],
    },
    {
      heading: "Transportation",
      chair: "Aidhya Irhash Putra, M.P., M.Agr. (UIN MY Batusangkar)",
      members: [
        "Bushra Hamid, S.Pd. (UIN MY Batusangkar)",
        "Hauliya Rahmah Z., S.Si. (UIN MY Batusangkar)",
      ],
    },
  ],
} as const;

export const organizers = [
  { name: "UIN Mahmud Yunus Batusangkar", logo: "/brand/uin-batusangkar.png" },
  { name: "Universitas Andalas", logo: "/brand/universitas-andalas.png" },
  { name: "Universitas Nasional", logo: "/brand/universitas-nasional.png" },
  { name: "Universitas Airlangga", logo: "/brand/universitas-airlangga.png" },
  { name: "Institut Teknologi Sepuluh Nopember", logo: "/brand/its.png" },
] as const;

export const supporters = [
  {
    name: "Himpunan Optika Indonesia (HOI) · Indonesian Optical Society (InOS)",
    logo: "/brand/inos-hoi.png",
  },
] as const;

export const footerColumns = [
  {
    heading: "General Information",
    links: [
      { label: "How to Register", href: null },
      { label: "Registration Fee", href: null },
      { label: "Call for Papers", href: "/call-for-papers" },
      { label: "Terms of Service", href: null },
      { label: "Privacy Policy", href: null },
      { label: "Refund Policy", href: null },
    ],
  },
] as const;

export const footerContact = [
  { icon: "mail", text: event.email },
  { icon: "pin", text: `${event.venue}, ${event.city}` },
  { icon: "calendar", text: event.dates },
] as const;

export const footerBlurb =
  "International Seminar on Photonics, Optics, and its Applications, bringing the science of light to the heart of Minangkabau.";

export const secretariat = {
  heading: "Local Organizer",
  lines: [
    "Sekretariat: Laboratorium Elektronika dan Instrumentasi (Gedung L)",
    "Tadris Fisika, Fakultas Tarbiyah dan Ilmu Keguruan",
    "UIN Mahmud Yunus Batusangkar",
    "Jalan Sudirman No. 137, Limo Kaum 27217",
  ],
  phoneLabel: "(0752) 71150",
  phoneHref: "tel:+6275271150",
  email: "isphoa2026@uinmybatusangkar.ac.id",
} as const;

export const copyright = "© 2026 ISPhOA. All rights reserved.";
export const colophon = `${event.shortName} ${event.edition} · ${event.city} · ${event.datesShort}`;
