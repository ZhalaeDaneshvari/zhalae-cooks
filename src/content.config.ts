import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: ({ image }) => z.object({
    title: z.string().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().default(''),
    heroImage: image(), heroAlt: z.string().min(1), gallery: z.array(image()).default([]),
    date: z.coerce.date(), originalCaption: z.string().optional(), instagramUrl: z.string().url().optional(),
    importSource: z.literal('instagram').optional(), importId: z.string().optional(),
    tags: z.array(z.string()).default([]), category: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Sides', 'Drinks', 'Other']).default('Other'),
    favorite: z.boolean().default(false), featured: z.boolean().default(false), archivedOnInstagram: z.boolean().default(false),
    hasRecipe: z.boolean().default(false), draft: z.boolean().default(true), needsReview: z.boolean().default(false),
    prepTime: z.number().int().nonnegative().optional(), cookTime: z.number().int().nonnegative().optional(), totalTime: z.number().int().positive().optional(), servings: z.number().positive().optional(),
    difficulty: z.string().optional(), cuisine: z.string().optional(), ingredients: z.array(z.string().min(1)).default([]), instructions: z.array(z.string().min(1)).default([]), notes: z.string().optional(), story: z.string().optional(),
  }).superRefine((entry, ctx) => {
    if (entry.hasRecipe && (!entry.ingredients.length || !entry.instructions.length || !entry.servings || entry.prepTime === undefined || entry.cookTime === undefined || !entry.totalTime)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Full recipes need ingredients, instructions, servings, prepTime, cookTime and totalTime. Keep hasRecipe false until ready.' });
  }),
});
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: ({ image }) => z.object({ title: z.string(), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string(), date: z.coerce.date(), heroImage: image().optional(), heroAlt: z.string().default(''), draft: z.boolean().default(true), tags: z.array(z.string()).default([]) }),
});
export const collections = { recipes, journal };
