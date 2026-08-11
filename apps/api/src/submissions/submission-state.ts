import { BadRequestException } from '@nestjs/common';

import type { SubmissionStatus } from '../database/schemas/submissions';

/**
 * Allowed status transitions. Postgres only knows the enum; the ordering rules
 * live here so author actions and committee actions get the same answer to
 * "can this move?".
 */
const TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  draft: ['submitted', 'withdrawn'],
  submitted: [
    'under_review',
    'revision_requested',
    'accepted',
    'rejected',
    'withdrawn',
  ],
  under_review: ['revision_requested', 'accepted', 'rejected', 'withdrawn'],
  revision_requested: ['submitted', 'withdrawn'],
  accepted: ['camera_ready_submitted', 'withdrawn'],
  rejected: [],
  camera_ready_submitted: ['accepted'],
  withdrawn: [],
};

export function canTransition(from: SubmissionStatus, to: SubmissionStatus) {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: SubmissionStatus,
  to: SubmissionStatus,
): void {
  if (!canTransition(from, to)) {
    throw new BadRequestException(
      `A submission cannot move from "${from}" to "${to}".`,
    );
  }
}

/** Authors may edit content only while the paper is theirs to change. */
export const EDITABLE_STATUSES: SubmissionStatus[] = [
  'draft',
  'revision_requested',
];

export function isEditableByAuthor(status: SubmissionStatus) {
  return EDITABLE_STATUSES.includes(status);
}
