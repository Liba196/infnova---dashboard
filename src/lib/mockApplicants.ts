import type {
  Applicant,
  ApplicantListParams,
  ApplicantListResponse,
  ApplicantSummary,
} from "../types/applicant";

const NAMES = [
  "Abebe Bikila",
  "Bekele Gerba",
  "Getachew Haile",
  "Dawit Yohannes",
  "Tamrat Tesfaye",
  "Alula Mekonnen",
  "Haile Selassie",
  "Yonas Assefa",
  "Samuel Berhanu",
  "Kidus Kebede",
  "Elias Tadesse",
  "Girma Wolde",
  "Tariku Mengistu",
  "Chala Ouma",
  "Gemechu Deresa",
  "Fikru Tolossa",
  "Abdi Alemayehu",
  "Mulugeta Teshome",
  "Zelalem Belay",
  "Henok Kassaye",
  "Ahmed Mohammed",
  "Nahom Dejene",
  "Surafel Mesfin",
  "Yared Tekle",
  "Solomon Abraham",
  "Tewodros Kassahun",
  "Aster Aweke",
  "Hirut Weldemariam",
  "Tigist Assefa",
  "Meseret Defar",
  "Genet Kebede",
  "Mahlet Samuel",
  "Kidist Getachew",
  "Selamawit Berhanu",
  "Chaltu Leta",
  "Libanos Yackob",
  "Birtukan Abera",
  "Marta Yohannes",
  "Etenesh Alemu",
  "Derartu Tulu",
  "Fana Haile",
  "Kalkidan Mekonnen",
  "Rahel Solomon",
  "Buzunesh Mesfin",
  "Lidya Tadesse",
  "Mimi Girma",
  "Wubrist Teklay",
  "Saba Abraham",
  "Fatuma Ahmed",
  "Mariamawit Dereje",
  "Yordanos Mulugeta",
  "Zenebech Tilahun",
];

const TRACKS: ApplicantSummary["track"][] = [
  "frontend",
  "backend",
  "ui-ux",
  "data-analytics",
  "mobile",
];
const STATUSES: ApplicantSummary["status"][] = [
  "pending",
  "shortlisted",
  "accepted",
  "rejected",
];
const COUNTRIES = ["Ethiopia"];

function makeEmail(fullName: string, idx: number) {
  const first = fullName
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return `${first}${idx}@example.com`;
}

export const MOCK_APPLICANTS: ApplicantSummary[] = NAMES.map((fullName, i) => ({
  id: `mock-${i + 1}`,
  fullName,
  email: makeEmail(fullName, i + 1),
  country: COUNTRIES[i % COUNTRIES.length],
  track: TRACKS[i % TRACKS.length],
  status: STATUSES[i % STATUSES.length],
  applicationDate: new Date(Date.now() - i * 86400000).toISOString(),
}));

export function getMockApplicants(
  params: ApplicantListParams = {},
): ApplicantListResponse {
  const { page = 1, limit = 10, search = "", status = "", track = "" } = params;

  let data = MOCK_APPLICANTS.slice();

  if (search) {
    const q = search.toLowerCase();
    data = data.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }

  if (status) data = data.filter((a) => a.status === status);
  if (track) data = data.filter((a) => a.track === track);

  const total = data.length;
  const start = (page - 1) * limit;
  const paged = data.slice(start, start + limit);

  return {
    data: paged,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export function getMockApplicant(id: string): Applicant | undefined {
  const summary = MOCK_APPLICANTS.find((a) => a.id === id || a.email === id);
  if (!summary) return undefined;
  return {
    ...summary,
    phoneNumber:
      "+251" +
      (600000000 + Number(summary.id.replace("mock-", "")))
        .toString()
        .slice(-9),
    skills: ["communication", "problem solving"],
    experienceLevel: "beginner",
    updatedAt: new Date().toISOString(),
  } as Applicant;
}
