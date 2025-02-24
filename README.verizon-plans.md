# Verizon Data Update Guide (February 2025)

## 1. Device Contributions

### Apple iPhone Contributions
| Device | DPP Price | Base | Welcome Upgrade | Plus/Ultimate Upgrade | Welcome New | Plus/Ultimate New |
|--------|-----------|------|-----------------|---------------------|-------------|------------------|
| iPhone 16 128GB | $840.00 | $15.00 | $15.00 | $35.00 | $35.00 | $75.00 |
| iPhone 16 Pro Max 1TB | $1,610.00 | $15.00 | $15.00 | $35.00 | $35.00 | $75.00 |
| iPhone 16 Pro 128GB | $1,010.00 | $15.00 | $15.00 | $35.00 | $35.00 | $75.00 |

### Samsung & Google Contributions
| Device | DPP Price | Base | Welcome Upgrade | Plus/Ultimate Upgrade | Welcome New | Plus/Ultimate New |
|--------|-----------|------|-----------------|---------------------|-------------|------------------|
| Galaxy S24 Ultra 512GB | $1,419.00 | - | $45.00 | $65.00 | $100.00 | $140.00 |
| Pixel 9 Pro 512GB | $1,219.99 | - | $45.00 | $65.00 | $100.00 | $140.00 |
| Galaxy S24 128GB | $818.00 | - | $45.00 | $65.00 | $100.00 | $140.00 |

## 2. Service Contributions

### Home Internet Services
| Service | Contribution | Spiff | Total |
|---------|-------------|-------|--------|
| MTM LTE Home Internet Plus | $100.00 | $120.00 | $220.00 |
| MTM 5G Home Internet Plus | $100.00 | $120.00 | $220.00 |
| MTM LTE/5G Home Internet | $50.00 | $100.00 | $150.00 |

### Business Internet
| Service | Total Contribution |
|---------|-------------------|
| 5G Business Internet 400M | $320.00 |
| 5G Business Internet 200M | $300.00 |
| 5G Business Internet 100M | $260.00 |

### Protection Services
| Service | Contribution | Spiff | Total |
|---------|-------------|-------|--------|
| Verizon Mobile Protect Multi/Single | $30.00 | $45.00 | $75.00 |
| Verizon Home Device Protect | $15.00 | $60.00 | $75.00 |
| Verizon Protect (NY) | $55.00 | - | $55.00 |

### Perks & Add-ons
| Service | Contribution | Spiff | Total |
|---------|-------------|-------|--------|
| VZ Perks | $20.00 | $15.00 | $35.00 |
| 3rd Party Perks | $10.00 | $25.00 | $35.00 |
| Redux Family | $35.99 | - | $35.99 |
| Redux Single | $20.00 | - | $20.00 |

### Eargo Services
| Service | Total Contribution |
|---------|-------------------|
| Eargo 7 Sale (instore) | $700.00 |
| Eargo 7 Sale (website) | $300.00 |
| Welcome Call | $300.00 |
| Link Sale | $281.00 |

## 3. Plan Details

### Unlimited Ultimate ($65/line with 4 lines)
- 5G Ultra Wideband
- 60GB Mobile Hotspot
- International features in 210+ countries
- 1080p streaming
- Enhanced video calling
- Up to 50% off 2 connected device plans

### Unlimited Plus ($55/line with 4 lines)
- 5G Ultra Wideband
- 30GB Mobile Hotspot
- Mexico & Canada features
- 720p streaming
- Up to 50% off 1 connected device plan

### Unlimited Welcome ($40/line with 4 lines)
- 5G network access
- Mexico & Canada features
- 480p streaming
- No mobile hotspot

## Line Pricing (per line)

| Plan      | 1 Line | 2 Lines | 3 Lines | 4 Lines | 5+ Lines |
|-----------|--------|---------|---------|---------|-----------|
| Ultimate  | $100   | $90     | $75     | $65     | $65      |
| Plus      | $90    | $80     | $65     | $55     | $55      |
| Welcome   | $75    | $65     | $50     | $40     | $40      |

*All prices shown include Auto Pay & Paper-free billing discount ($10/mo)

## Files

- `update_verizon_plans.sql`: Plan pricing and features
- `update_verizon_promotions.sql`: Current deals and offers
- `update_verizon_contributions.sql`: Device and service contributions
- `server/update-verizon-data.js`: Update script for all data

## Running the Update Script

```bash
npm run update-verizon
```

This will update:
1. Plan pricing and features
2. Current promotions and deals
3. Device and service contributions

## Prerequisites

Environment variables required:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key
```

## Support

For questions about contribution amounts or other issues, please contact the development team.
