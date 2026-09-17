/*
# Migration 12: Add Academic Integrity legal page

## Overview
Inserts the Academic Integrity / Responsible Research Support legal page
referenced in the prompt. Also ensures the /academic-integrity route works
by adding a slug alias.
*/

INSERT INTO public.legal_pages (slug, title, content)
VALUES (
  'academic-integrity',
  'Academic Integrity / Responsible Research Support',
  'ProjectHub NG is committed to promoting academic integrity and responsible research practices.

Our Position

ProjectHub NG provides research support, guidance, tutoring, editing, consultation, and presentation preparation services. We do NOT support or facilitate:

- Plagiarism or submitting another person''s work as your own
- Fabricated research data or results
- Impersonation of a student in any academic activity
- Academic misconduct of any kind

What We Provide

- Research topic guidance and brainstorming
- Literature review support and methodology guidance
- Chapter structuring and academic writing guidance
- Referencing and formatting assistance
- Questionnaire design and data collection guidance
- Data presentation and analysis guidance
- Presentation slide preparation and defense coaching
- Project explanation sessions

Student Responsibilities

Students who use our services are expected to:

- Meaningfully participate in their own project work
- Use our guidance as support, not as a replacement for their own effort
- Comply with their institution''s academic rules and regulations
- Submit original work that reflects their own understanding
- Take full responsibility for the content they submit

By using ProjectHub NG, you confirm that you will use the services responsibly and in accordance with your institution''s academic rules.

If you have any questions about our academic integrity policy, please contact us.'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content;
