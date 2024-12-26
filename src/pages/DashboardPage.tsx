import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, DollarSign, Users, Clock } from 'lucide-react';

const stats = [
  {
    title: 'Total Loans',
    value: '₱2.4M',
    description: 'Active loans',
    icon: DollarSign,
  },
  {
    title: 'Active Clients',
    value: '48',
    description: 'Last 30 days',
    icon: Users,
  },
  {
    title: 'Payment Rate',
    value: '98.5%',
    description: 'On-time payments',
    icon: BarChart,
  },
  {
    title: 'Next Due',
    value: '12',
    description: 'Payments this week',
    icon: Clock,
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}