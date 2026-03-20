/* ──────────────────────────────────────────
   API: /api/analytics — aggregated analytics data
   Fellows & mentors distribution by state, gender;
   Fellow qualifications grouped by subject area.
   ────────────────────────────────────────── */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { Fellow, Mentor } from "@/models";
import { requireAuth } from "@/lib/auth-guard";
import { jsonOk, jsonError } from "@/lib/api-helpers";

/** Map of keyword patterns → canonical qualification group */
const QUALIFICATION_GROUPS: Record<string, string[]> = {
  "Mathematics": ["math", "maths", "mathematics"],
  "Nursing": ["nursing", "nurse"],
  "Medicine": ["medicine", "medical", "mbbs", "mb;bs"],
  "Pharmacy": ["pharmacy", "pharmacist", "pharm"],
  "Biology": ["biology", "biological"],
  "Chemistry": ["chemistry", "chemical"],
  "Physics": ["physics"],
  "Biochemistry": ["biochemistry", "biochem"],
  "Microbiology": ["microbiology", "microbio"],
  "Computer Science": ["computer", "computing", "software", "information technology", "i.t"],
  "Engineering": ["engineering", "engineer"],
  "Public Health": ["public health"],
  "Anatomy": ["anatomy"],
  "Physiology": ["physiology"],
  "Medical Laboratory": ["medical lab", "med lab", "laboratory science", "laboratory technology"],
  "Health Education": ["health education", "health ed"],
  "Education": ["education", "b.ed", "bed", "nce"],
  "Agriculture": ["agriculture", "agric", "agricultural"],
  "Economics": ["economics", "econs"],
  "Accounting": ["accounting", "accountancy"],
  "Business": ["business", "management"],
  "Law": ["law", "llb"],
  "Sociology": ["sociology"],
  "Political Science": ["political science", "political"],
  "Environmental Science": ["environmental"],
  "Nutrition": ["nutrition", "dietetics", "food science"],
  "Dental": ["dental", "dentistry"],
  "Optometry": ["optometry", "optom"],
  "Radiography": ["radiography", "radiographer"],
  "Physiotherapy": ["physiotherapy"],
};

function classifyQualification(raw: string): string {
  const lower = raw.toLowerCase().trim();
  for (const [group, keywords] of Object.entries(QUALIFICATION_GROUPS)) {
    if (keywords.some(kw => lower.includes(kw))) return group;
  }
  return "Other";
}

export async function GET(_request: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    await connectDB();

    // Fetch all fellows with their mentor data
    const fellows = await Fellow.find()
      .populate({ path: "mentor", select: "states" })
      .lean();

    // Fetch all mentors with their states
    const mentors = await Mentor.find().lean();

    // ── Fellows by state (via mentor.states) ──
    const fellowsByState: Record<string, number> = {};
    const fellowsByGender: Record<string, number> = {};
    const fellowsByStateGender: Record<string, Record<string, number>> = {};
    const qualificationCounts: Record<string, number> = {};

    for (const f of fellows) {
      // Gender distribution
      const gender = (f.gender || "Unknown").toUpperCase();
      fellowsByGender[gender] = (fellowsByGender[gender] || 0) + 1;

      // State distribution (from mentor)
      const mentor = f.mentor as unknown as { states?: string[] } | null;
      const states = mentor?.states ?? [];
      for (const state of states) {
        const s = state.toUpperCase();
        fellowsByState[s] = (fellowsByState[s] || 0) + 1;

        if (!fellowsByStateGender[s]) fellowsByStateGender[s] = {};
        fellowsByStateGender[s][gender] = (fellowsByStateGender[s][gender] || 0) + 1;
      }

      // Qualification classification
      if (f.qualification) {
        const group = classifyQualification(f.qualification);
        qualificationCounts[group] = (qualificationCounts[group] || 0) + 1;
      }
    }

    // ── Mentors by state ──
    const mentorsByState: Record<string, number> = {};
    for (const m of mentors) {
      for (const state of m.states) {
        const s = state.toUpperCase();
        mentorsByState[s] = (mentorsByState[s] || 0) + 1;
      }
    }

    // Format outputs
    const fellowStateData = Object.entries(fellowsByState)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    const fellowGenderData = Object.entries(fellowsByGender)
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count);

    const fellowStateGenderData = Object.entries(fellowsByStateGender)
      .map(([state, genders]) => ({
        state,
        ...genders,
        total: Object.values(genders).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);

    const mentorStateData = Object.entries(mentorsByState)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    const qualificationData = Object.entries(qualificationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return jsonOk({
      totalFellows: fellows.length,
      totalMentors: mentors.length,
      fellowsByState: fellowStateData,
      fellowsByGender: fellowGenderData,
      fellowsByStateGender: fellowStateGenderData,
      mentorsByState: mentorStateData,
      qualifications: qualificationData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Analytics API Error:", message);
    return jsonError(`Analytics Server Error: ${message}`, 500);
  }
}
