import { z } from 'zod'

export const reportSchema = z.object({
  description: z
    .string()
    .min(10, 'La descrizione deve contenere almeno 10 caratteri')
    .max(5000, 'La descrizione non può superare i 5000 caratteri'),
  is_anonymous: z.boolean().default(false),
  contact_info: z
    .string()
    .email('Inserisci un indirizzo email valido')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    // Se is_anonymous è true, contact_info deve essere vuoto o null
    if (data.is_anonymous) {
      return !data.contact_info || data.contact_info.trim() === ''
    }
    return true
  },
  {
    message: 'Il contatto non può essere fornito se si sceglie di rimanere anonimi',
    path: ['contact_info'],
  }
)

export type ReportFormData = z.infer<typeof reportSchema>
