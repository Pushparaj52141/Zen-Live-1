-- Add jobsupport to leads.status check constraint (if present).
-- Run only if status updates fail with a constraint violation.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS status_format_check;

ALTER TABLE leads ADD CONSTRAINT status_format_check CHECK (
  status::text = ANY (
    ARRAY[
      'enquiry',
      'prospect',
      'enrollment',
      'trainingprogress',
      'handsonproject',
      'certification',
      'cvbuild',
      'mockinterviews',
      'liveinterviews',
      'placement',
      'placementdue',
      'placementpaid',
      'finishers',
      'jobsupport',
      'onhold',
      'archived'
    ]::text[]
  )
);
