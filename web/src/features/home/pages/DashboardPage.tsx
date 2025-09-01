import React from 'react';

import {
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

const stats: StatCard[] = [
  {
    title: 'Total Revenue',
    value: '$124,580',
    change: '+12.5%',
    icon: DollarSign,
    trend: 'up',
    color: 'bg-green-500',
  },
  {
    title: 'Active Clients',
    value: '1,432',
    change: '+5.2%',
    icon: Users,
    trend: 'up',
    color: 'bg-blue-500',
  },
  {
    title: 'Pending Tasks',
    value: '28',
    change: '-8.1%',
    icon: FileText,
    trend: 'down',
    color: 'bg-amber-500',
  },
  {
    title: 'Monthly Growth',
    value: '18.2%',
    change: '+2.4%',
    icon: TrendingUp,
    trend: 'up',
    color: 'bg-purple-500',
  },
];

export function DashboardPage(): React.JSX.Element {
  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                  <Icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trend === 'up'
                      ? 'text-green-600'
                      : stat.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500">Chart goes here</p>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {[
              {
                text: 'New client registered',
                time: '2 hours ago',
                icon: CheckCircle,
                color: 'text-green-500',
              },
              {
                text: 'Invoice #1234 paid',
                time: '4 hours ago',
                icon: DollarSign,
                color: 'text-blue-500',
              },
              {
                text: 'Task deadline approaching',
                time: '6 hours ago',
                icon: AlertCircle,
                color: 'text-amber-500',
              },
              {
                text: 'Report generated',
                time: '8 hours ago',
                icon: FileText,
                color: 'text-purple-500',
              },
            ].map((activity, index) => {
              const ActivityIcon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <ActivityIcon className={`h-5 w-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Tasks Widget */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Tasks</h2>
          <div className="space-y-3">
            {[
              { task: 'Review Q4 financial report', priority: 'High' },
              { task: 'Client meeting preparation', priority: 'Medium' },
              { task: 'Update documentation', priority: 'Low' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm text-gray-700">{item.task}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    item.priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : item.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'New Invoice', color: 'bg-blue-500' },
              { label: 'Add Client', color: 'bg-green-500' },
              { label: 'Generate Report', color: 'bg-purple-500' },
              { label: 'View Analytics', color: 'bg-amber-500' },
            ].map((action, index) => (
              <button
                key={index}
                className={`p-3 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ${action.color}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
