// src/services/invoiceService.ts
import db from '../db';
import { Invoice } from '../types/invoice';
import axios from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';

interface InvoiceRow {
  id: string;
  userId: string;
  amount: number;
  dueDate: Date;
  status: string;
}

class InvoiceService {
  static async list( userId: string, status?: string, operator?: string): Promise<Invoice[]> {
    let q = db<InvoiceRow>('invoices').where({ userId: userId });
    if (status) q = q.andWhereRaw(" status "+ operator + " '"+ status +"'");
    const rows = await q.select();
    const invoices = rows.map(row => ({
      id: row.id,
      userId: row.userId,
      amount: row.amount,
      dueDate: row.dueDate,
      status: row.status} as Invoice
    ));
    return invoices;
  }

  static async setPaymentCard(
    userId: string,
    invoiceId: string,
    paymentBrand: string,
    ccNumber: string,
    ccv: string,
    expirationDate: string
  ) {
    // use axios to call http://paymentBrand/payments as a POST request
    // with the body containing ccNumber, ccv, expirationDate
    // and handle the response accordingly

    // Actualmente toma paymentBrand para realizar el POST, pero ese parametro
    // viene del body que le pasa el usuario sin ninguna validación desde invoice Controller
    //     const paymentBrand = req.body.paymentBrand;
    // Por lo tanto, el atacante puede enviar una request a un destino cualquiera, obteniendo datos
    // sensibles del sistma, realizando así un ataque SSRF
    // Para mitigarlo, en vez de aceptar cualquier paymentBrand, podemos solo permitir marcas conocidas
    // como por ejemplo VISA, MASTER, ETC.

    const ALLOWED_PAYMENT_BRANDS: Record<string, string> = {
      visa: "http://visa-gateway:8080",
      master: "http://master.gateway:8080"
    };

    if (!ALLOWED_PAYMENT_BRANDS[paymentBrand]) {
      throw new Error("Invalid payment brand");
    }
    const paymentBrandUrl = `${ALLOWED_PAYMENT_BRANDS[paymentBrand]}/payments`;
    const paymentResponse = await axios.post(paymentBrandUrl, {
      ccNumber,
      ccv,
      expirationDate
    });
    if (paymentResponse.status !== 200) {
      throw new Error('Payment failed');
    }

    // Update the invoice status in the database
    await db('invoices')
      .where({ id: invoiceId, userId })
      .update({ status: 'paid' });  
    };
  static async  getInvoice( invoiceId:string): Promise<Invoice> {
    const invoice = await db<InvoiceRow>('invoices').where({ id: invoiceId }).first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice as Invoice;
  }

  // En este metodo, el pdfName viene desde el body del usuario, entonces, el usuario al poder definir
  // el nombre, puede estar colocando una ruta, que haga que el sistema ingrese a carpetas que no debería
  // ingresar, generando así un path traversal
  // por ejemplo, el usuario puede ingresar ../../../../etc/passwd

  static async getReceipt(
    invoiceId: string,
    pdfName: string
  ) {
    // check if the invoice exists
    const invoice = await db<InvoiceRow>('invoices').where({ id: invoiceId }).first();
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    const baseDir = path.resolve('/invoices');
    const safePath = path.normalize(path.join(baseDir, pdfName));

    if (!safePath.startsWith(baseDir)) {
      throw new Error('Invalid file path');
    }
    try {
      const content = await fs.readFile(safePath, 'utf-8');
      return content;
    } catch (error) {
      // send the error to the standard output
      console.error('Error reading receipt file:', error);
      throw new Error('Receipt not found');

    } 

  };

};

export default InvoiceService;
