import leadService from '@shared/services/leads/leadService'

const CERTIFICATION_STATUS = 'certification'

async function confirmGenerateCertificate() {
  const { default: Swal } = await import('sweetalert2')
  const result = await Swal.fire({
    title: 'Generate certificate?',
    text: 'Send certificate to this lead\'s email, or only update status to Certification.',
    icon: 'question',
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: 'Yes, generate & send',
    cancelButtonText: 'No, status only',
    reverseButtons: true,
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#64748b',
  })
  return result.isConfirmed
}

export async function handleCardDrop(leadId, newStatus) {
  const isMovingToCertification =
    String(newStatus).toLowerCase() === CERTIFICATION_STATUS

  let generateCertificate = false
  if (isMovingToCertification) {
    generateCertificate = await confirmGenerateCertificate()
  }

  const res = await leadService.updateLeadStatus(leadId, newStatus, {
    ...(isMovingToCertification && { generateCertificate }),
  })

  if (res && !res.error) {
    return true
  }

  if (res && res.error) {
    alert(res.error || 'Failed to update status')
  }
  return false
}
