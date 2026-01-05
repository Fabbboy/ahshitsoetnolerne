export const DRAFT_KEY = "ahs_draft_v1";
export const SETTINGS_KEY = "ahs_settings_v1";
export const POLICY_KEY = "ahs_policy_v1";

export const starterDraft = `# ahshitsoetnolerne

## Topic
- Course:
- Exam date:
- Allowed size: A4 (1 page)

## Core formulas
- 

## Key concepts
- 

## Reminders
- 
`;

export const defaultPolicy = {
  size: "A4",
  orientation: "portrait",
  marginMm: 10,
  fontSizePx: 11,
} as const;
