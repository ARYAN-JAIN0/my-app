import { MetricCard } from "@/components/shared/data-display/metric-card";
import { Chart } from "@/components/shared/data-display/chart";
import { Users, TrendingUp, DollarSign, Clock } from "lucide-react";

export function InsightsSection() {
  const leadData = [12, 19, 15, 25, 22, 30];
  const conversionData = [65, 72, 68, 80, 75, 85];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Leads"
          value="1,234"
          change="+12% from last month"
          trend="up"
          icon={<Users className="w-4 h-4" />}
        />
        <MetricCard
          title="Qualified Leads"
          value="456"
          change="+8% from last month"
          trend="up"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <MetricCard
          title="Pipeline Value"
          value="$2.4M"
          change="+24% from last month"
          trend="up"
          icon={<DollarSign className="w-4 h-4" />}
        />
        <MetricCard
          title="Avg. Response Time"
          value="2.5h"
          change="-15% from last month"
          trend="up"
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-lg font-semibold mb-4">Lead Trends</h3>
          <Chart data={leadData} type="line" height={200} />
        </div>
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="text-lg font-semibold mb-4">Conversion Rate</h3>
          <Chart data={conversionData} type="bar" height={200} />
        </div>
      </div>
    </div>
  );
}
