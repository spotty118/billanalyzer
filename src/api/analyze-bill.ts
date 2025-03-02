import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const formData = await parseForm(req);
      const analysisResult = await processBillData(formData);
      res.status(200).json(analysisResult);
    } catch (error: any) {
      console.error('API Error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze bill' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}

const parseForm = (req: NextApiRequest): Promise<formidable.FormidableData> => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ fields, files });
    });
  });
};

export const processBillData = async (formData: FormData): Promise<any> => {
  try {
    const billFile = formData.files.billFile as formidable.File | formidable.File[];

    if (!billFile || Array.isArray(billFile)) {
      throw new Error('Bill file is missing or invalid.');
    }

    const fileContent = fs.readFileSync(billFile.filepath, 'utf-8');

    // Basic parsing logic (replace with actual parsing)
    const totalAmount = parseFloat(fileContent.match(/Total\s*:\s*[\$\d\.]+/)?.[0].replace(/[^0-9\.]/g, '') || '0');
    const accountNumber = fileContent.match(/Account Number:\s*(\d+)/)?.[1] || 'Unknown';
    const billingPeriod = 'Example Billing Period'; // Extract from file if possible

    // Dummy phone line data
    const phoneLines = [
      {
        phoneNumber: '555-123-4567',
        deviceName: 'iPhone 13',
        planName: 'Unlimited',
        monthlyTotal: totalAmount / 2,
        details: {
          planCost: totalAmount / 2,
          planDiscount: 5,
          devicePayment: 20,
          deviceCredit: 10,
          protection: 12,
          perks: 5,
          perksDiscount: 2,
          surcharges: 8,
          taxes: 10,
        },
      },
      {
        phoneNumber: '555-987-6543',
        deviceName: 'Samsung Galaxy S21',
        planName: 'Unlimited',
        monthlyTotal: totalAmount / 2,
        details: {
          planCost: totalAmount / 2,
          planDiscount: 5,
          devicePayment: 20,
          deviceCredit: 10,
          protection: 12,
          perks: 5,
          perksDiscount: 2,
          surcharges: 8,
          taxes: 10,
        },
      },
    ];

    // Dummy charges by category
    const chargesByCategory = {
      plans: totalAmount * 0.4,
      devices: totalAmount * 0.2,
      protection: totalAmount * 0.1,
      surcharges: totalAmount * 0.1,
      taxes: totalAmount * 0.1,
      other: totalAmount * 0.1,
    };

    return {
      accountNumber,
      totalAmount,
      billingPeriod,
      phoneLines,
      chargesByCategory,
    };
  } catch (error: any) {
    console.error('Error processing bill data:', error);
    throw new Error(error.message || 'Failed to process bill data.');
  }
};
