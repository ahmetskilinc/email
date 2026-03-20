'use client'

import { useParams, useRouter } from 'next/navigation'
import { MailLayout } from '@/components/mail/mail'
import { useLabels } from '@/hooks/use-labels'
import { useEffect, useState } from 'react'

const ALLOWED_FOLDERS = new Set(['inbox', 'draft', 'sent', 'spam', 'bin', 'archive', 'snoozed'])

export default function MailPage() {
  const params = useParams()
  const folder = params.folder as string
  const router = useRouter()
  const [isLabelValid, setIsLabelValid] = useState<boolean | null>(true)

  const isStandardFolder = ALLOWED_FOLDERS.has(folder)
  const { userLabels, isLoading: isLoadingLabels } = useLabels()

  useEffect(() => {
    if (isStandardFolder) {
      setIsLabelValid(true)
      return
    }
    if (isLoadingLabels) return
    if (userLabels) {
      const checkLabelExists = (labels: any[]): boolean => {
        for (const label of labels) {
          if (label.id === folder) return true
          if (label.labels && label.labels.length > 0) {
            if (checkLabelExists(label.labels)) return true
          }
        }
        return false
      }
      const labelExists = checkLabelExists(userLabels)
      setIsLabelValid(labelExists)
      if (!labelExists) {
        const timer = setTimeout(() => { router.push('/mail/inbox') }, 2000)
        return () => clearTimeout(timer)
      }
    } else {
      setIsLabelValid(false)
    }
  }, [folder, userLabels, isLoadingLabels, isStandardFolder, router])

  if (!isLabelValid) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Folder not found</h2>
        <p className="text-muted-foreground mt-2">
          The folder you&apos;re looking for doesn&apos;t exist. Redirecting to inbox...
        </p>
      </div>
    )
  }

  return <MailLayout />
}
