import { z } from 'zod';

const dimensionField = z
  .number({ invalid_type_error: 'Dimension must be a number' })
  .positive('Dimension must be positive')
  .max(999_999.999, 'Dimension must be less than 999999.999')
  .nullable()
  .optional();

const unitField = z
  .enum(['meters', 'feet', 'inches', 'centimeters'], {
    errorMap: () => ({ message: 'Unit of measurement is required' }),
  })
  .nullable()
  .optional();

const measurementRefinement = (data: {
  length?: number | null;
  breadth?: number | null;
  height?: number | null;
  unitOfMeasurement?: 'meters' | 'feet' | 'inches' | 'centimeters' | null;
}, ctx: z.RefinementCtx) => {
  const dimensions = [data.length, data.breadth, data.height];
  const hasAnyDimension = dimensions.some((value) => value !== undefined && value !== null);
  const hasAllDimensions = dimensions.every((value) => typeof value === 'number');
  const hasUnit = data.unitOfMeasurement !== undefined && data.unitOfMeasurement !== null;

  if (hasAnyDimension || hasUnit) {
    if (!hasAllDimensions || !hasUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'All measurement fields (length, breadth, height, unit) must be provided together',
        path: ['length'],
      });
    }
  }
};

const baseMeasurementSchema = {
  length: dimensionField,
  breadth: dimensionField,
  height: dimensionField,
  unitOfMeasurement: unitField,
};

export const createLocationTagSchema = z
  .object({
    unitId: z.string().uuid(),
    locationTagName: z.string().min(1).max(200),
    ...baseMeasurementSchema,
  })
  .superRefine(measurementRefinement);

export const updateLocationTagSchema = z
  .object({
    unitId: z.string().uuid().optional(),
    locationTagName: z.string().min(1).max(200).optional(),
    ...baseMeasurementSchema,
  })
  .superRefine(measurementRefinement);

export type CreateLocationTagInput = z.infer<typeof createLocationTagSchema>;
export type UpdateLocationTagInput = z.infer<typeof updateLocationTagSchema>;
