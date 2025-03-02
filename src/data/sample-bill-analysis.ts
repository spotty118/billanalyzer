
// Sample bill analysis data for demonstration purposes
export const sampleBillAnalysis = {
  accountNumber: "526905159-00001",
  totalAmount: 646.3,
  billingPeriod: "Dec 12 - Jan 11, 2025",
  devices: [
    {
      device: "Apple iPhone 15 Pro Max",
      deviceType: "iPhone",
      phoneNumber: "2517470017",
      planType: "Unlimited Plus"
    },
    {
      device: "Apple iPhone 15",
      deviceType: "iPhone",
      phoneNumber: "2517470238",
      planType: "Unlimited Plus"
    },
    {
      device: "Apple iPhone 13",
      deviceType: "iPhone",
      phoneNumber: "2517472221",
      planType: "Unlimited Plus"
    },
    {
      device: "Apple iPhone 14 Plus",
      deviceType: "iPhone",
      phoneNumber: "2517472223",
      planType: "Unlimited Plus"
    },
    {
      device: "Apple iPhone 14",
      deviceType: "iPhone",
      phoneNumber: "2517479281",
      planType: "Unlimited Plus"
    }
  ],
  phoneLines: [
    {
      phoneNumber: "2517470017",
      deviceName: "Apple iPhone 15 Pro Max",
      planName: "Unlimited Plus",
      monthlyTotal: 135.25,
      details: {
        planCost: 80,
        planDiscount: 10,
        devicePayment: 47.91,
        deviceCredit: 0,
        protection: 17.34,
        perks: 0,
        perksDiscount: 0,
        surcharges: 0,
        taxes: 0
      }
    },
    {
      phoneNumber: "2517470238",
      deviceName: "Apple iPhone 15",
      planName: "Unlimited Plus",
      monthlyTotal: 107.34,
      details: {
        planCost: 70,
        planDiscount: 10,
        devicePayment: 35.42,
        deviceCredit: 5.42,
        protection: 17.34,
        perks: 0,
        perksDiscount: 0,
        surcharges: 0,
        taxes: 0
      }
    },
    {
      phoneNumber: "2517472221",
      deviceName: "Apple iPhone 13",
      planName: "Unlimited Plus",
      monthlyTotal: 102.84,
      details: {
        planCost: 55,
        planDiscount: 10,
        devicePayment: 27.92,
        deviceCredit: 0,
        protection: 17.34,
        perks: 0,
        perksDiscount: 0,
        surcharges: 5.33,
        taxes: 7.25
      }
    },
    {
      phoneNumber: "2517472223",
      deviceName: "Apple iPhone 14 Plus",
      planName: "Unlimited Plus",
      monthlyTotal: 123.22,
      details: {
        planCost: 45,
        planDiscount: 10,
        devicePayment: 38.75,
        deviceCredit: 0,
        protection: 17.34,
        perks: 15,
        perksDiscount: 0,
        surcharges: 9.13,
        taxes: 8.00
      }
    },
    {
      phoneNumber: "2517479281",
      deviceName: "Apple iPhone 14",
      planName: "Unlimited Plus",
      monthlyTotal: 117.65,
      details: {
        planCost: 42,
        planDiscount: 10,
        devicePayment: 33.33,
        deviceCredit: 0,
        protection: 17.34,
        perks: 25,
        perksDiscount: 5,
        surcharges: 7.98,
        taxes: 7.00
      }
    }
  ],
  charges: []
};
