
import { BillData, UsageAnalysisResult, UsageSegment, PlanOptimizationResult } from './types';

export class VerizonBillAnalyzer {
  private billData: BillData;

  constructor(billData: BillData) {
    this.billData = billData;
  }

  private parseDateString(dateStr?: string): Date | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
      return null;
    } catch (e) {
      console.error(`Error parsing date: ${dateStr}`, e);
      return null;
    }
  }

  public getBillSummary(): { [key: string]: any } {
    const accountInfo = this.billData.account_info || {};
    const billSummary = this.billData.bill_summary || {};

    return {
      account_number: accountInfo.account_number || 'Unknown',
      billing_period: {
        start: accountInfo.billing_period_start || 'Unknown',
        end: accountInfo.billing_period_end || 'Unknown'
      },
      total_charges: {
        previous_balance: billSummary.previous_balance || 0,
        payments: billSummary.payments || 0,
        current_charges: billSummary.current_charges || 0,
        total_due: billSummary.total_due || 0
      }
    };
  }

  public getUsageAnalysis(): UsageAnalysisResult {
    let totalDataGB = 0;
    let totalMinutes = 0;
    let totalTexts = 0;
    let lineCount = 0;
    
    const phoneUsage = new Map<string, {
      data: number;
      minutes: number;
      texts: number;
    }>();

    // Process usage data
    Object.entries(this.billData.usage_details || {}).forEach(([phone, details]) => {
      lineCount++;
      
      details.forEach(usage => {
        // Parse data usage
        let dataGB = 0;
        if (typeof usage.data_usage === 'string') {
          try {
            const [value, unit] = usage.data_usage.split(/\s+/);
            dataGB = parseFloat(value);
            if (unit?.includes('MB')) {
              dataGB /= 1024;
            }
          } catch (error) {
            console.error(`Error parsing data usage: ${usage.data_usage}`, error);
          }
        }

        // Parse minutes
        let minutes = 0;
        if (typeof usage.talk_minutes === 'string') {
          try {
            const [hours, mins] = usage.talk_minutes.split(':');
            minutes = parseInt(hours) * 60 + parseInt(mins);
          } catch (error) {
            console.error(`Error parsing talk minutes: ${usage.talk_minutes}`, error);
          }
        }

        // Parse texts
        const texts = parseInt(usage.text_count || '0');

        // Update totals
        totalDataGB += dataGB;
        totalMinutes += minutes;
        totalTexts += texts;

        // Update per-phone usage
        const phoneStats = phoneUsage.get(phone) || { data: 0, minutes: 0, texts: 0 };
        phoneStats.data += dataGB;
        phoneStats.minutes += minutes;
        phoneStats.texts += texts;
        phoneUsage.set(phone, phoneStats);
      });
    });

    // Calculate averages
    const avgDataGB = lineCount ? totalDataGB / lineCount : 0;
    const avgMinutes = lineCount ? totalMinutes / lineCount : 0;
    const avgTexts = lineCount ? totalTexts / lineCount : 0;

    // Identify high usage lines
    const highDataUsers = Array.from(phoneUsage.entries())
      .filter(([_, stats]) => stats.data > avgDataGB * 1.5)
      .map(([phone]) => phone);

    const highTalkUsers = Array.from(phoneUsage.entries())
      .filter(([_, stats]) => stats.minutes > avgMinutes * 1.5)
      .map(([phone]) => phone);

    const highTextUsers = Array.from(phoneUsage.entries())
      .filter(([_, stats]) => stats.texts > avgTexts * 1.5)
      .map(([phone]) => phone);

    return {
      avg_data_usage_gb: avgDataGB,
      avg_talk_minutes: avgMinutes,
      avg_text_count: avgTexts,
      high_data_users: highDataUsers,
      high_talk_users: highTalkUsers,
      high_text_users: highTextUsers
    };
  }

  public optimizePlan(): PlanOptimizationResult {
    const usage = this.getUsageAnalysis();
    const summary = this.getBillSummary();
    const lineCount = Object.keys(this.billData.usage_details || {}).length;

    const recommendations: LineRecommendation[] = [];

    // Check high data users
    usage.high_data_users.forEach(phone => {
      recommendations.push({
        phone_number: phone,
        recommendation: "High data usage detected. Consider unlimited data plan.",
        potential_savings: "Variable - may prevent overage charges"
      });
    });

    // Check for family plan opportunity
    if (lineCount >= 4) {
      recommendations.push({
        phone_number: "ALL",
        recommendation: "Multiple lines detected. Consider family plan options.",
        potential_savings: "~$20-50 per month total"
      });
    }

    return {
      current_line_count: lineCount,
      avg_monthly_bill: summary.total_charges.current_charges,
      line_recommendations: recommendations
    };
  }
}
