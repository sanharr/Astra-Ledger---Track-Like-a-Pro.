import React, { useMemo } from 'react';
import { 
  Sparkles, Activity, PieChart, TrendingUp, Trash2, Receipt 
} from 'lucide-react';
import { 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Expense, CategoryStat } from '../types';
import { CURRENCY_SYMBOL } from '../constants';

interface DashboardProps {
  expenses: Expense[];
  advisorTip: string | null;
  onDelete: (id: string) => void;
}

const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB', '#E5E7EB'];

const Dashboard: React.FC<DashboardProps> = ({ expenses, advisorTip, onDelete }) => {
  
  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  
  const categoryStats: CategoryStat[] = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      // Normalize category case
      const cat = (e.category || 'Other').charAt(0).toUpperCase() + (e.category || 'Other').slice(1).toLowerCase();
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    
    return Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: totalSpent ? Math.round((amount / totalSpent) * 100) : 0,
        fill: COLORS[index % COLORS.length]
      }));
  }, [expenses, totalSpent]);

  const CategoryIcon = () => (
    <div className="flex items-center justify-center rounded-full bg-gray-100 p-2 text-black">
       <Receipt className="w-4 h-4" />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-white h-full">
      <div className="max-w-3xl mx-auto space-y-8 pb-20">
        
        {/* Advisor Card */}
        <div className="bg-gradient-to-br from-[#F5F5F7] to-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-24 h-24 text-black" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-white rounded-xl shadow-sm ring-1 ring-black/5">
              <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
            </div>
            <div>
              <h3 className="font-bold text-black text-sm mb-1 uppercase tracking-wide">AI Financial Coach</h3>
              <p className="text-gray-600 text-sm leading-relaxed font-medium">
                {advisorTip || "Tracking patterns. Keep logging to unlock insights..."}
              </p>
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="bg-black rounded-[2rem] p-8 text-white shadow-2xl shadow-gray-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-800 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="relative z-10">
            <p className="text-gray-400 font-medium mb-1 text-sm uppercase tracking-wider">Total Ledger</p>
            <h2 className="text-5xl font-semibold tracking-tight mb-6">
              {CURRENCY_SYMBOL} {totalSpent.toLocaleString()}
            </h2>
            <div className="flex items-center gap-2 text-xs font-medium bg-white/10 w-fit px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="text-gray-300">Live Agent Monitoring</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Categories Chart */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-black" />
              <h3 className="font-bold text-black text-lg">Spending Flow</h3>
            </div>
            
            {categoryStats.length === 0 ? (
               <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                  Awaiting Data
               </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={categoryStats}
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="amount"
                        stroke="none"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${CURRENCY_SYMBOL}${value.toLocaleString()}`, 'Amount']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 space-y-3">
                  {categoryStats.slice(0, 4).map((cat) => (
                    <div key={cat.name} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }}></div>
                         <span className="font-medium text-gray-700">{cat.name}</span>
                      </div>
                      <span className="text-gray-500 font-medium">{cat.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions List */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-black" />
              <h3 className="font-bold text-black text-lg">Recent Log</h3>
            </div>

            {expenses.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                 <p>System Idle</p>
              </div>
            ) : (
              <div className="space-y-0 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {expenses.slice(0, 20).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between group py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/80 transition-colors px-3 -mx-3 rounded-xl">
                    <div className="flex items-center gap-4">
                      <CategoryIcon />
                      <div>
                        <p className="font-semibold text-[#1D1D1F] text-sm">{expense.item}</p>
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                          {expense.createdAt?.toMillis 
                            ? new Date(expense.createdAt.toMillis()).toLocaleDateString() 
                            : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="font-bold text-[#1D1D1F] text-sm">-{CURRENCY_SYMBOL} {expense.amount.toLocaleString()}</span>
                       {expense.id && (
                        <button 
                          onClick={() => onDelete(expense.id!)}
                          className="text-gray-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #d1d5db; }
      `}</style>
    </div>
  );
};

export default Dashboard;
