import fetch from 'node-fetch';

async function fetchPlans() {
  try {
    const response = await fetch('http://localhost:4000/scrape-tags');
    const data = await response.json();
    
    console.log('\nCurrent Verizon Plans:\n');
    data.plans.forEach(plan => {
      console.log(`Plan: ${plan.name}`);
      if (plan.prices) {
        console.log('Prices:');
        Object.entries(plan.prices).forEach(([type, price]) => {
          console.log(`  ${type}: ${price}`);
        });
      }
      if (plan.features && plan.features.length > 0) {
        console.log('Features:');
        plan.features.forEach(feature => {
          console.log(`  • ${feature}`);
        });
      }
      if (plan.perks && plan.perks.length > 0) {
        console.log('Perks:');
        plan.perks.forEach(perk => {
          console.log(`  • ${perk.title}${perk.price ? ` (${perk.price})` : ''}`);
        });
      }
      console.log('-'.repeat(50));
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
  }
}

fetchPlans();