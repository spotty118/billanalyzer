export interface Promotion {
  id: string;
  title: string;
  startDate: string;
  keyPoints: string[];
  eligibility: string[];
  partnerType: string;
  promoType: string;
}

export const promotions: Promotion[] = [
  {
    id: "1",
    title: "BMSM: TCL Tab 10 NTXPAPER 5G for $4/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Get TCL Tab 10 NTXPAPER 5G for $4/mo when purchased with a 5G Android smartphone ($100 discount)",
      "Both devices must be purchased on Device Payment",
      "Eligible Tablet: Tab 10 NXTPAPER 5G | $100 discount when Buy Device is on any unlimited",
      "DPP required",
      "Stackable with tablet trade; not stackable with standalone tablets",
      "A single Buy can qualify for one BMSM of each device type (Tab, Watch, etc)",
      "Tablet will need to be a new line to qualify for promo; activations only"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "2",
    title: "BMSM - $130 off Gizmo Watch 3 Adventure/Gizmo Watch 3",
    startDate: "01.09.25",
    keyPoints: [
      "Customers can get $129.99 off the Gizmo Watch 3 Adventure/Gizmo Watch 3 when purchased with any 5G Smartphone",
      "New and Upgrades eligible",
      "No plan requirement",
      "Discount via 36 mo recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "3",
    title: "BMSM - Apple Watch SE as low as $5/mo ($120 off)",
    startDate: "01.09.25",
    keyPoints: [
      "Customers can get the Apple Watch SE for as low as $5/mo with the purchase of any 5G iPhone",
      "Discount applied via recurring BIC",
      "No Plan Requirement",
      "36 mo recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "4",
    title: "BMSM - Google Pixel Watch (2nd gen) as low as $5/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Get the Google Pixel Watch 2 as low as $5/mo with the purchase of any 5G Android Smartphone",
      "$120 Off",
      "No Plan Requirement",
      "36 mo recurring BIC",
      "Watch line must be a new line of service"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "5",
    title: "BMSM - iPad as low as $5/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Customers can save $320 off any iPad when purchased with a 5G iPhone",
      "Eligible devices: iPad: 10th Gen, iPad Mini (2021 and A17), 10.9\" iPad Air(4th&5th), 11\" iPad Pro (4th Gen, 2021, M4), 12\" iPad Pro (6th Gen and 2021), 11\" iPad Air, 13\" iPad Air, 13\" iPad Pro",
      "No plan requirement",
      "Discount applied via recurring BIC",
      "Stackable with tablet trade; not stackable with standalone tablets",
      "A single Buy can qualify for one BMSM of each device type (Tab, Watch, etc)",
      "Tablet must be on a new line to qualify for promo",
      "Purchase type: DPP"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "6",
    title: "BMSM: Razer Edge for $10/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Purchase any 5G smartphone on DPP and get $239.99 off of the Razer Edge 5G on DPP",
      "Razer Edge must be purchased on a new line - smartphone can be either new line or upgrade",
      "No plan requirement",
      "A single Buy can qualify for one BMSM of each device type (Tab, Watch, etc)",
      "Discount applied via 36 month recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "7",
    title: "BMSM - Samsung Galaxy Watches as low as $5/mo",
    startDate: "01.09.25",
    keyPoints: [
      "$170 off select watches with purchase of a 5G Android smartphones (Watch6 Classic / Watch7)",
      "No plan requirement",
      "Both smartphone and watch must be purchased on DPP",
      "36 month recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "8",
    title: "BMSM - Samsung Watch FE as low as $5/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Get the Samsung Galaxy Watch FE as low as $5/mo w/ the purchase of any 5G Android smartphone",
      "$69.99 off",
      "Stackable with Watch Trade",
      "Both smartphone and watch must be purchased on DPP",
      "Discount applied via 36 month recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "9",
    title: "BMSM - Select Samsung Tablets as low as $5/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Get select Samsung tablets as low as $5/mo when purchased with any Android 5G Smartphone",
      "Both devices must be purchased on Device Payment",
      "Eligible Tablets / Discounts: Tab S9 FE (discount $369.99), Tab S10+ (discount $249.99)",
      "Tablet must be on new line; new tablet activations only",
      "Discount applied via 36 month recurring BIC",
      "No plan requirement",
      "Stackability: Stackable with tablet trade; not stackable with standalone tablets",
      "A single Buy can qualify for one BMSM of each device type (Tab, Watch, etc)"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Tablets/Connected Devices"
  },
  {
    id: "10",
    title: "BYOD: $180 BIC w/ Unlimited Welcome",
    startDate: "01.09.25",
    keyPoints: [
      "Get a $180 BIC when activating a 4G/5G BYOD Smartphone on Unlimited Welcome",
      "Unlimited Welcome plan required",
      "Discount applied via 36 month recurring BIC",
      "Not stackable with other gift card offers"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "BYOD"
  },
  {
    id: "11",
    title: "BYOD: $360 BIC w/ Unlimited Plus",
    startDate: "01.09.25",
    keyPoints: [
      "Get a $360 BIC when activating a 4G/5G BYOD Smartphone on Unlimited Plus",
      "Unlimited Plus plan required",
      "Eligible for new activations, AAL, port-in (port not required), pre to post",
      "Discount applied via 36 month recurring BIC",
      "Not stackable with other gift card offers"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "BYOD"
  },
  {
    id: "12",
    title: "BYOD: $540 BIC w/ Unlimited Ultimate",
    startDate: "01.09.25",
    keyPoints: [
      "Get a $540 BIC when activating a 4G/5G BYOD Smartphone on Unlimited Ultimate (port not req'd)",
      "Unlimited Ultimate plan required",
      "Eligible for new activations, AAL, port-in (port not required), pre to post",
      "Discount applied via 36 month recurring BIC",
      "Not stackable with other gift card offers"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "BYOD"
  },
  {
    id: "13",
    title: "Southern California Wildfire: Emergency Relief Offer",
    startDate: "01.09.25",
    keyPoints: [
      "This offer has been extended to 2.28 for areas in LA & Ventura only",
      "Verizon is providing unlimited domestic Talk, Text & Data to our active postpaid, prepaid, and SMB customers in certain ZIP codes impacted by the Southern California Wildfires",
      "View the impacted locations ZIP Code list in OST 381875 to see areas eligible for relief and dates"
    ],
    eligibility: [
      "Postpaid",
      "Prepaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Trade in",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Other"
  },
  {
    id: "14",
    title: "Kyocera DuraForce Pro 3 for $15/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Get the DuraForce Pro3 for $15/mo when adding a new line w/ myPlan",
      "DuraForce Pro3 - $359.99 off",
      "Plan requirement: Unlimited Ultimate, Unlimited Plus, Unlimited Welcome",
      "Does not stack with other standalone offers",
      "Discount applied via 36 month recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "AllPhones"
  },
  {
    id: "15",
    title: "Select 5G Smartphones as low as $0/mo",
    startDate: "01.09.25",
    keyPoints: [
      "Buy select smartphones on a new line of service and receive discounts based on unlimited plan",
      "Eligible Devices and discounts:",
      "iPhone 15: $0/mo ($729.99 off) w/ Ultimate, Plus, & Welcome",
      "iPhone 15 Plus: $0/mo ($829.99 off) w/ Ultimate & Plus | $5/mo ($649.99 off) w/ Welcome",
      "iPhone 14: $0/mo ($629.99 off) w/ Ultimate, Plus, & Welcome",
      "iPhone 14 Plus: $0/mo ($729.99 off) w/ Ultimate, Plus, & Welcome",
      "Galaxy S24 FE: $0/mo ($649.99 off) w/ Ultimate, Plus, & Welcome",
      "iPhone SE (2022): $0/mo ($429.99 off) w/ Ultimate, Plus, & Welcome",
      "Pixel 9a: $0/mo ($499.99 off) w/ Ultimate, Plus, & Welcome (3/19~)",
      "Discount applied via 36 month recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "AllPhones"
  },
  {
    id: "16",
    title: "Trade in: $180 off select tablets or laptops",
    startDate: "01.09.25",
    keyPoints: [
      "Get $180 off for trading in select tablets/laptops towards the purchase of select tablets/laptops",
      "Eligible \"Buy\" Devices:",
      "Apple iPads: 10.9in10th Gen, iPad Mini (2024), iPad Pro 11 inch (2022/2024), 13-inch iPad Pro (2024), 12.9-inch iPad Pro (2022), 11-inch iPad Air (2024), 13-inch iPad Air (2024)",
      "Android: Tab A9+, Tab A9+ Kids, Tab S9 FE, Tab S10+",
      "Tablet trade in Trade Matrix / can be either cellular or BT/WiFi only version",
      "No Plan requirement (consumer), Business ($19.99+)",
      "DPP or Full Retail",
      "Discount applied via 36 month recurring BIC",
      "Stackable with Standalone tablet and BMSM for watches, tablets and laptops",
      "Damaged trade in not eligible"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Trade in"
  },
  {
    id: "17",
    title: "Trade - GTI: Select smartwatches as low as $0/mo with trade-in",
    startDate: "01.09.25",
    keyPoints: [
      "Get up to $650 off select watches with qualifying trade (as low as free)",
      "Eligible Watch Trade-ins for promotional discount:",
      "$180 Trade Discount: Google: Pixel Watch 2, Samsung: Galaxy Watch 6 Classic, Watch 7, Watch FE, Apple: Watch SE (2022)",
      "$250 Trade Discount: Samsung Watch 6",
      "$450 Trade Discount: Apple Watch Series 9, Google Pixel watch 3",
      "$500 Trade Discount: Apple Watch Series 10, Apple Watch Ultra 2",
      "$650 Trade Discount: Samsung Watch Ultra",
      "No plan requirement",
      "Discount applied via recurring BIC"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Trade in"
  },
  {
    id: "18",
    title: "Up to $800 off Select Androids for New Lines & Upgrades w/ Trade-in",
    startDate: "01.09.25",
    keyPoints: [
      "Get up to $800 off of select Android smartphones with a qualifying trade & select unlimited (upgrades & new lines qualify)",
      "NOTE: Any iPhone, Samsung, or Google smartphone (any condition, including legacy models) can be traded in - Other OEM smartphones are tradeable, but refer to the OST for participation",
      "Eligible Devices / Values",
      "S24, S24+, S24 Ultra, Z Flip6, Z Fold6, Pixel 9 Pro Fold, Google Pixel 9, 9 Pro, 9, Pro XL:",
      "New Lines: $800 off w/ Unlimited Ultimate - $620 w/ Plus - $400 w/ Unlimited Welcome",
      "Upgrades: $800 off w/ Unlimited Ultimate - $400 off w/ Plus - No discount available for the Welcome Tier",
      "Discount applied via 36 month recurring BIC",
      "NOTE: For Upgrades, the device the customer is trading-in must have been active on their account for 60 days prior to trade-in - see OST for more details",
      "Not stackable with Standalone promos"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Trade in",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Trade in"
  },
  {
    id: "19",
    title: "Up to $830 off iPhone 16 Models for New Lines & Upgrades w/ Trade-in",
    startDate: "01.09.25",
    keyPoints: [
      "Get up to $830 off of iPhone 16 Series with a qualifying trade & select unlimited (upgrades & new lines qualify)",
      "NOTE: Any iPhone, Samsung, or Google smartphone (any condition, including legacy models) can be traded in - Other OEM smartphones are tradeable, but refer to the OST for participation",
      "Eligible Devices / Values",
      "iPhone 16, 16 Plus, 16 Pro, 16 Pro Max:",
      "New Lines: $830 off w/ Unlimited Ultimate - $650 w/ Plus - $415 w/ Unlimited Welcome",
      "Upgrades: $830 off w/ Unlimited Ultimate - $415 off w/ Plus - No discount available for the Welcome Tier",
      "Discount applied via 36 month recurring BIC",
      "NOTE: For Upgrades, the device the customer is trading-in must have been active on their account for 60 days prior to trade-in - see OST for more details",
      "Not stackable with Standalone promos"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Trade in",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Trade in"
  },
  {
    id: "20",
    title: "Fios $200 VZ GC - Local Promo",
    startDate: "01.03.25",
    keyPoints: [
      "$200 VZ GC | Premium plans",
      "Direct/Retail: enabling 204 stores with self-serve model, where Rep creates referral & customer self serves using tablet in-store",
      "Indirect: 740 Indirect stores within the Fios footprint",
      "Stackable with lead offers"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Fios"
  },
  {
    id: "21",
    title: "Fios: VHI 5 Year Price Guarantee",
    startDate: "01.03.25",
    keyPoints: [
      "5-year price guarantee for new Verizon Home Internet (\"VHI\") households who have not subscribed to a VHI service within the last 90 days",
      "New Acquisition FWA/Fios Prospects (all channels)",
      "FWA Premium and Entry Plans: 5GH Plus, LTEH Plus, 5GH, LTEH",
      "Fios Premium and Mid/Entry Plans; 2Gig, 1Gig, 500M, 300M"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Fios"
  },
  {
    id: "22",
    title: "FWA: VHI 5 Year Price Guarantee",
    startDate: "01.03.25",
    keyPoints: [
      "5-year price guarantee for new Verizon Home Internet (\"VHI\") households who have not subscribed to a VHI service within the last 90 days",
      "New Acquisition FWA/Fios Prospects (all channels)",
      "FWA Premium and Entry Plans: 5GH Plus, LTEH Plus, 5GH, LTEH"
    ],
    eligibility: [
      "New Account",
      "Add A Line",
      "Port Ins"
    ],
    partnerType: "Verizon",
    promoType: "FWA"
  },
  {
    id: "23",
    title: "iONT Fios $200 Amazon GC / Walmart $200 VZ GC",
    startDate: "01.03.25",
    keyPoints: [
      "Targeted leadlist offer",
      "Leadlist contains SOC iONT prospects",
      "Customers are eligible to receive a $200 Amazon GC",
      "Customers who purchase new service at Walmart will be eligible for a $200 Verizon GC",
      "Applies to 2G or 1G plans only",
      "65 day waiting period / 60 day redemption window"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Fios"
  },
  {
    id: "24",
    title: "Pay Off Your Phone Switcher Promo: Up to $800 Prepaid Mastercard",
    startDate: "12.20.24",
    keyPoints: [
      "Port-in & purchase any 5G smartphone on myPlan and qualify for a prepaid eMastercard of up to $800 to pay off your bill with your existing carrier",
      "Once Device, Plan, & port now indicator is selected, the ability to enter the exact payoff amount and upload bill image unlocks",
      "Images of customers most recent bill must be uploaded (bill within 30 days)",
      "Customers MTN that they are porting over",
      "Amount that customer owes on that MTN",
      "Must be at month 4 or later of installment agreement",
      "Customer receives confirmation email - 30 day hold begins upon transaction completion",
      "Customer will have a notification in MyVerizon indicating they are eligible to submit for rebate",
      "They will also have the ability to view offer details, agree to T's & C's, & submit rebate",
      "If service is canceled w/in 6 months; or eligibility req's are no longer met, cust will be charged back the full value of the prepaid Mastercard",
      "Allow up to 8 weeks for Gift Card to be sent via email"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Port Ins",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Port In"
  },
  {
    id: "25",
    title: "Prepaid: iPhone SE (3rd Gen) 64 GB for $0 w/ Verizon Prepaid Unlimited Plan",
    startDate: "10.23.24",
    keyPoints: [
      "Get the iPhone SE 5G (3rd Gen) for $0 in Direct/Indirect Channels after 12 months on Verizon Prepaid Unlimited plan",
      "Direct Channel: Originally $429.99. Get $310 off at checkout, customer pays $119.99 at the point of sale",
      "Indirect Channel: Originally $160. Get $40 off at checkout, customer pays $119.99 at the point of sale",
      "Customer receives $10 discount monthly for 12 months",
      "Customer must activate on any new Verizon Prepaid Unlimited Plan",
      "New Smartphone/AAL activation required on a $60 or $70 Unlimited plan",
      "Can be stacked with other services offers (Autopay, loyalty discounts, ML discount)",
      "Sku/s: MMX53LL/A, MMX63LL/A & MMX73LL/A"
    ],
    eligibility: [
      "Prepaid",
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Prepaid"
  },
  {
    id: "26",
    title: "Prepaid: Samsung Galaxy A15 5G for $0 w/ Verizon Prepaid Unlimited Plan",
    startDate: "10.23.24",
    keyPoints: [
      "Customer pays $119.99 at POS and then receives a $10 credit monthly for 12 mo. on any new Verizon Prepaid Unlimited Plan",
      "Discount Redemption- $10 discount monthly for 12 months on a new Verizon Prepaid Unlimited Plan",
      "Customer must activate on any new Verizon Prepaid Unlimited Plan",
      "New/AAL Smartphone activation required on a $60 or $70 Unlimited plan",
      "Can be stacked with other services offers (Autopay, loyalty discounts, ML discount)",
      "SKU: SMA156UZKV (Retail/ Digital)"
    ],
    eligibility: [
      "Prepaid"
    ],
    partnerType: "Verizon",
    promoType: "Prepaid"
  },
  {
    id: "27",
    title: "VZ Prepaid Promo Offers- Moto G 5G on us",
    startDate: "10.18.24",
    keyPoints: [
      "Get the Moto G 5G for as low as $0 when activating on a eligible Verizon Prepaid Plan",
      "Customer Pays $0 at point of sale. ($99.99 instant discount)",
      "Requires New/AAL smartphone activation",
      "Can be stacked with other services offers (Autopay, loyalty discounts, ML discount)",
      "Smartphone activation required on a $60 or $70 Unlimited plan",
      "MOTXT2417DPP is the eligible sku"
    ],
    eligibility: [
      "Prepaid",
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Prepaid"
  },
  {
    id: "28",
    title: "VZ Prepaid Promo Offers- Moto G Play on us on plans $45 higher",
    startDate: "10.18.24",
    keyPoints: [
      "Get the moto g play for as low as $0 when activating on a eligible Verizon Prepaid Plan",
      "Customer Pays $0 at point of sale. ($69.99 instant discount)",
      "Requires New/AAL smartphone activation",
      "Can be stacked with other services offers (Autopay, loyalty discounts, ML discount)",
      "Smartphone activation required on specific plans: Verizon Prepaid $45, Verizon Prepaid Unlimited Plan ($60 or $70)",
      "MOTXT2413VPP is the eligible sku"
    ],
    eligibility: [
      "Prepaid",
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Prepaid"
  },
  {
    id: "29",
    title: "VZ Prepaid Promo Offers- TCL 50XE 5G on us",
    startDate: "10.18.24",
    keyPoints: [
      "Get the TCL 50XE 5G for as low as $0 when activating on a eligible Verizon Prepaid Plan",
      "Customer pays $0 at point of sale. ($99.99 instant discount)",
      "Requires New/AAL smartphone activation",
      "Can be stacked with other services offers (Autopay, loyalty discounts, ML discount)",
      "Smartphone activation required on a $60 or $70 Unlimited plan",
      "TCL-T614SPP is the eligible sku"
    ],
    eligibility: [
      "Prepaid",
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Prepaid"
  },
  {
    id: "30",
    title: "Fios Cross-sell Pre-Install Cancel One Month on Us",
    startDate: "10.08.24",
    keyPoints: [
      "Current Mobile Customers who:",
      "have a pending order or cancel pending Fios orders in the last 90 days, can get One Month on us when they finish their order through manual add",
      "cancelled Fios orders in the last 90 days can get One Month on us when they start a new Fios order.",
      "Fios Internet Only",
      "Stacks with lead Fios offers & M+H Discount",
      "Available to all speeds > 100M",
      "Redemption upon Activation- Automatic upon Fios activation and reflected in 1-2 billing cycles"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Fios"
  },
  {
    id: "31",
    title: "Fios Exclusive Offer: $10 for 24 months",
    startDate: "09.25.24",
    keyPoints: [
      "Lead List based",
      "Current mobile customers eligible to add Fios in a leadlist that are in Competitive DMAs and high decile propensity to add Fios will be able to get $10 off for 24 months on their Fios Internet and Fios Internet + TV",
      "Fios Internet & Fios Internet + TV",
      "Stacks with lead Fios offers & M+H Discount",
      "Available to all speeds > 100M",
      "Redemption upon Activation"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Fios"
  },
  {
    id: "32",
    title: "FWA- YouTube TV - $10 x 12 mo Promotion",
    startDate: "07.24.24",
    keyPoints: [
      "Save $10/mo for 12 months - $62.99/mo ($120 savings) - Regular price is $72.99/mo",
      "YouTube TV is a TV streaming service that includes live TV from 100+ broadcast, cable, and regional sports networks like ABC, CBS, NBC, ESPN, AMC, HGTV, TNT, and more",
      "There are no contracts or installations, and customers can cancel anytime",
      "Stream on your own devices at home and on the go on compatible smart TVs, phones, tablets, game consoles, and more",
      "Share up to 6 household accounts and 3 streams",
      "Unlimited DVR space"
    ],
    eligibility: [
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Entertainment"
  },
  {
    id: "33",
    title: "Fios- YouTube TV - VHI - $10 x 12 mo Promotion",
    startDate: "07.24.24",
    keyPoints: [
      "Save $10/mo for 12 months - $62.99/mo ($120 savings) - Regular price is $72.99/mo",
      "YouTube TV is a TV streaming service that includes live TV from 100+ broadcast, cable, and regional sports networks like ABC, CBS, NBC, ESPN, AMC, HGTV, TNT, and more",
      "There are no contracts or installations, and customers can cancel anytime",
      "Stream on your own devices at home and on the go on compatible smart TVs, phones, tablets, game consoles, and more",
      "Share up to 6 household accounts and 3 streams",
      "Unlimited DVR space"
    ],
    eligibility: [
      "New Account",
      "Add A Line",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Entertainment"
  },
  {
    id: "34",
    title: "Latino Global Choice Promotion",
    startDate: "04.01.24",
    keyPoints: [
      "Verizon will offer a 36 months free Global Choice promo to New to Verizon and New AAL customers on Welcome Unlimited, Unlimited Plus plans",
      "Choose 1 of 17 Latin American (LATAM) countries and get up to 300 minutes to the country of your choice",
      "Free after $10/mo. BIC for 36 months",
      "After allowance is met, get discounted rates to selected country",
      "Plus, discounted calling to 220+ countries"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Port Ins",
      "Prepaid to Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "International"
  },
  {
    id: "35",
    title: "ViX Premium 6 months On Us Promo",
    startDate: "04.01.24",
    keyPoints: [
      "Verizon expanded its partnership with ViX in an effort to win back Tier 1 markets via Latinos",
      "6 months on us offer to be used as an acquisition promotion and available to new and existing accounts (post paid wireless, FWA, Fios broadband only) and/or add a line",
      "ViX Premium brings together the largest collection of Spanish-language sports, TV, and movies",
      "70 ViX Originals per year, highest volume of Spanish-language originals than any other streamer",
      "first look deals with Latino storytellers",
      "14,000 hours of Spanish-language content, 80% exclusive, incremental to linear"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "Trade in",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid",
      "Digital Exclusive",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Entertainment"
  },
  {
    id: "36",
    title: "+Play: Xbox Game Pass Ultimate One Month on Us",
    startDate: "03.18.24",
    keyPoints: [
      "We are currently running a 30 Day Free Trial on Xbox Game Pass Ultimate on +play",
      "Two new Xbox games are coming out in March - MLB \"The Show\" on 3.19 and Diablo IV on 3.28",
      "This is a great opportunity to let customers know they can take advantage of the 30 Day free trial offer and enjoy these 2 new bestselling game series",
      "Offer is for first-time Xbox Game Pass Ultimate subscribers only",
      "After one month promo period, the subscription auto-renews at the current monthly price (currently $16.99/mo) unless canceled",
      "Service is managed through +play"
    ],
    eligibility: [
      "Postpaid"
    ],
    partnerType: "Verizon",
    promoType: "Entertainment"
  },
  {
    id: "37",
    title: "Second Number Limited Time Promotion",
    startDate: "03.07.24",
    keyPoints: [
      "For a limited time only, customers who activate Second Number within 90 days of launch will have an introductory price of $10 per month. This is a $5 per month savings",
      "This promotional offer is available in all channels",
      "Effective 3/25, Costco is no longer eligible for this promotion"
    ],
    eligibility: [
      "Postpaid",
      "New Account",
      "Add A Line",
      "BYOD",
      "Trade in",
      "Upgrades",
      "Port Ins",
      "Prepaid to Postpaid",
      "Plan Required"
    ],
    partnerType: "Verizon",
    promoType: "Other"
  },
  {
    id: "38",
    title: "Unlimited Welcome Pricing Promotion (Local Growth Pricing Offer)",
    startDate: "01.11.24",
    keyPoints: [
      "Verizon will be offering $10, $15 and $20 plan discounts on new 1, 2, and 3 line activations respectively in 31 CMAs",
      "Lines must be activated on Unlimited Welcome only; device purchase or BYOD",
      "Discount will be applied for 36 months",
      "The Promotion is stackable with device offers and Mobile & Home discounts; but not stackable with other pricing discounts",
      "Customer Accounts with 4+ lines are ineligible for this offer"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "Price Plan"
  },
  {
    id: "39",
    title: "LTE Home Internet Contract Buy Out Promotion",
    startDate: "01.20.22",
    keyPoints: [
      "Customers can receive up to a $500 bill credit to cover any Early Termination Fee (ETF) charged by their previous internet provider when they switch to Verizon LTE Home Internet",
      "This offer applies to Early Termination Fees only - No other charges are eligible"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "FWA"
  },
  {
    id: "40",
    title: "5G Home Internet Contract Buy Out Promotion",
    startDate: "04.29.21",
    keyPoints: [
      "Customers can receive up to a $500 bill credit to cover any Early Termination Fee (ETF) charged by their previous internet provider when they switch to Verizon 5G Home Internet",
      "This offer applies to Early Termination Fees only - No other charges are eligible"
    ],
    eligibility: [
      "New Account"
    ],
    partnerType: "Verizon",
    promoType: "FWA"
  }
];
