"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

// global
const parentURL = "/dashboard/invoices";

// create
const CreateInvoice = FormSchema.omit({ id: true, date: true });

// update
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// create
export async function createInvoice(formData: FormData) {
  // if has few fields
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });
  // if has many fields
  //   const rawFormData = Object.fromEntries(formData.entries());

  // convert amounts to cents
  const amountInCents = toCents(amount);

  // new date
  const date = new Date().toISOString().split("T")[0];

  try {
    // insert to db
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Invoice.",
    };
  }

  // revalidate
  revalidatePath(parentURL);

  // redirect after submit
  redirect(parentURL);
}

// update
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = toCents(amount);

  try {
    // update record
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id} 
    `;
  } catch (error) {
    return {
      message: "Database Error: Failed to Update Invoice.",
    };
  }

  // revalidate
  revalidatePath(parentURL);

  // redirect after submit
  redirect(parentURL);
}

// delete
export async function deleteInvoice(id: string) {
  // showing error.tsx
  // throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    
    // revalidate
    revalidatePath(parentURL);

    return {
      message: "Invoice Deleted."
    }
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Invoice.",
    };
  }

}

// helper functions
function toCents(amount: number) {
  return amount * 100;
}
