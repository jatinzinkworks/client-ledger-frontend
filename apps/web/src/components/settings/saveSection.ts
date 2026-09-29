import { fieldErrors } from '@cl/api'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'

/**
 * Validates and saves one settings section. Resolves `true` on success; on failure maps the
 * backend's field-level rejections onto the section's fields and resolves `false` (the
 * request error itself stays on the mutation, where the page reports it).
 */
export async function saveSection<TInput extends FieldValues, TOutput>(
  form: UseFormReturn<TInput, unknown, TOutput>,
  save: (values: TOutput) => Promise<unknown>,
): Promise<boolean> {
  let saved = false
  await form.handleSubmit(async (values) => {
    try {
      await save(values)
      saved = true
    } catch (error) {
      for (const [field, message] of Object.entries(fieldErrors(error))) {
        form.setError(field as Path<TInput>, { message })
      }
    }
  })()
  return saved
}
