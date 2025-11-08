
import React, { useState, useMemo } from 'react';
import type { Trip, Friend, Expense, Settlement, Balance } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ShareIcon, SparklesIcon, PencilIcon } from './icons';
import { generateTripSummary } from '../services/geminiService';

interface TripDetailScreenProps {
  trip: Trip;
  friends: Friend[];
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

const TripDetailScreen: React.FC<TripDetailScreenProps> = ({ trip, friends, onUpdateTrip, onDeleteTrip }) => {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidById, setPaidById] = useState<string>('');
  const [splitWith, setSplitWith] = useState<string[]>([]);
  const [geminiSummary, setGeminiSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [editableMembers, setEditableMembers] = useState<string[]>(trip.members);
  
  const tripMembers = useMemo(() => friends.filter(f => trip.members.includes(f.id)), [friends, trip.members]);
  const getFriendName = (id: string) => friends.find(f => f.id === id)?.name || 'Unknown';
  
  const { balances, settlements } = useMemo(() => {
    const balancesMap = new Map<string, number>();
    trip.members.forEach(memberId => balancesMap.set(memberId, 0));

    trip.expenses.forEach(expense => {
      balancesMap.set(expense.paidById, (balancesMap.get(expense.paidById) || 0) + expense.amount);
      const share = expense.amount / expense.splitWith.length;
      expense.splitWith.forEach(memberId => {
        balancesMap.set(memberId, (balancesMap.get(memberId) || 0) - share);
      });
    });

    const balancesArr: Balance[] = Array.from(balancesMap.entries()).map(([friendId, amount]) => ({ friendId, amount }));
    
    // Settlement Logic
    const debtors = balancesArr.filter(b => b.amount < 0).map(b => ({...b, amount: -b.amount}));
    const creditors = balancesArr.filter(b => b.amount > 0);
    const settlementsArr: Settlement[] = [];

    debtors.sort((a,b) => b.amount - a.amount);
    creditors.sort((a,b) => b.amount - a.amount);

    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settlementAmount = Math.min(debtor.amount, creditor.amount);

      if(settlementAmount > 0.01) {
         settlementsArr.push({ from: debtor.friendId, to: creditor.friendId, amount: settlementAmount });
         debtor.amount -= settlementAmount;
         creditor.amount -= settlementAmount;
      }
      
      if(debtor.amount < 0.01) i++;
      if(creditor.amount < 0.01) j++;
    }
    
    return { balances: balancesArr, settlements: settlementsArr };
  }, [trip]);


  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && parseFloat(amount) > 0 && paidById && splitWith.length > 0) {
      const newExpense: Expense = {
        id: crypto.randomUUID(),
        description,
        amount: parseFloat(amount),
        paidById,
        splitWith,
      };
      onUpdateTrip({ ...trip, expenses: [...trip.expenses, newExpense] });
      // Reset form
      setDescription('');
      setAmount('');
      setPaidById('');
      setSplitWith([]);
      setIsExpenseModalOpen(false);
    }
  };
  
  const handleDeleteExpense = (expenseId: string) => {
    onUpdateTrip({...trip, expenses: trip.expenses.filter(e => e.id !== expenseId)});
  };

  const handleOpenExpenseModal = () => {
    setPaidById(trip.members[0] || '');
    setSplitWith([...trip.members]);
    setIsExpenseModalOpen(true);
  };
  
  const handleSplitWithToggle = (friendId: string) => {
    setSplitWith(prev => prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]);
  };
  
  const generateShareableText = () => {
    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    let text = `Hi everyone, here's the expense summary for our trip: "${trip.name}"!\n\n`;
    text += `Total spent: ₹${totalSpent.toFixed(2)}\n\n`;
    text += `--- Expenses ---\n`;
    trip.expenses.forEach(exp => {
      const desc = exp.description || 'Unspecified Expense';
      text += `- ${desc}: ₹${exp.amount.toFixed(2)} (Paid by ${getFriendName(exp.paidById)})\n`;
    });
    text += `\n--- Time to Settle Up! ---\n`;
    if (settlements.length === 0) {
        text += "Everyone is settled up. Great job!\n";
    } else {
        settlements.forEach(s => {
          text += `- ${getFriendName(s.from)} should pay ${getFriendName(s.to)} ₹${s.amount.toFixed(2)}\n`;
        });
    }
    return text;
  };

  const handleShare = (platform: 'email' | 'whatsapp') => {
    const text = generateShareableText();
    const encodedText = encodeURIComponent(text);

    if (platform === 'email') {
      const emails = tripMembers.map(m => m.email).join(',');
      window.location.href = `mailto:${emails}?subject=Expense Summary: ${trip.name}&body=${encodedText}`;
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
    }
  };

  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    setGeminiSummary('');
    const summary = await generateTripSummary(trip, friends, settlements);
    setGeminiSummary(summary);
    setIsSummaryLoading(false);
  };

  const totalExpenses = useMemo(() => trip.expenses.reduce((sum, exp) => sum + exp.amount, 0), [trip.expenses]);

  const handleMemberToggle = (friendId: string) => {
    setEditableMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleUpdateMembers = () => {
    const membersToRemove = trip.members.filter(id => !editableMembers.includes(id));
    const isMemberInvolved = (memberId: string) => trip.expenses.some(exp => exp.paidById === memberId || exp.splitWith.includes(memberId));
    
    const involvedMembersToRemove = membersToRemove.filter(isMemberInvolved);

    if (involvedMembersToRemove.length > 0) {
      const memberNames = involvedMembersToRemove.map(getFriendName).join(', ');
      alert(`Cannot remove ${memberNames}. They are involved in existing expenses. Please remove their expenses first.`);
      return;
    }

    onUpdateTrip({ ...trip, members: editableMembers });
    setIsMembersModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">{trip.name}</h2>
                <p className="text-lg text-neutral dark:text-gray-400 mt-1">{trip.date}</p>
                <p className="text-lg text-neutral dark:text-gray-300 mt-1">Total Spent: <span className="font-bold text-primary dark:text-accent">₹{totalExpenses.toFixed(2)}</span></p>
            </div>
            <button 
                onClick={() => { setEditableMembers(trip.members); setIsMembersModalOpen(true); }} 
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center transition-colors shrink-0 ml-4">
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Members
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Expenses & Summary */}
        <div className="lg:col-span-2 space-y-8">
           {/* Expenses Section */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Expenses</h3>
              <button onClick={handleOpenExpenseModal} className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg flex items-center transition-transform transform hover:scale-105">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Expense
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {trip.expenses.length === 0 ? (
                <p className="p-6 text-center text-neutral dark:text-gray-400">No expenses added yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {trip.expenses.map(expense => (
                    <li key={expense.id} className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{expense.description || 'Unspecified Expense'}</p>
                        <p className="text-sm text-neutral dark:text-gray-400">Paid by {getFriendName(expense.paidById)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800 dark:text-white">₹{expense.amount.toFixed(2)}</p>
                        <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full mt-1"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Gemini Summary Section */}
          <section>
            <h3 className="text-2xl font-bold mb-4">AI Trip Summary</h3>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              {geminiSummary ? (
                <div className="whitespace-pre-wrap font-serif text-gray-700 dark:text-gray-300 leading-relaxed">{geminiSummary}</div>
              ) : (
                 isSummaryLoading && <div className="text-center text-neutral dark:text-gray-400">Generating your fun trip summary...</div>
              )}
              <button
                onClick={handleGenerateSummary}
                disabled={isSummaryLoading || trip.expenses.length === 0}
                className="mt-4 w-full bg-accent hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <SparklesIcon className="w-5 h-5 mr-2" />
                {isSummaryLoading ? 'Thinking...' : 'Generate Fun Summary'}
              </button>
              {trip.expenses.length === 0 && <p className="text-xs text-center mt-2 text-neutral dark:text-gray-500">Add some expenses to generate a summary.</p>}
            </div>
          </section>
        </div>

        {/* Right column: Balances & Actions */}
        <div className="space-y-8">
            {/* Balances Section */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Balances</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-3">
                {balances.map(balance => (
                  <div key={balance.friendId} className="flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{getFriendName(balance.friendId)}</span>
                    <span className={`font-bold text-lg ${balance.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balance.amount >= 0 ? `+${balance.amount.toFixed(2)}` : balance.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Settlements Section */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Who Owes Who</h3>
               <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                {settlements.length === 0 ? (
                  <p className="text-center text-neutral dark:text-gray-400">All settled up!</p>
                ) : (
                  <ul className="space-y-4">
                    {settlements.map((s, i) => (
                      <li key={i} className="flex items-center justify-between text-center">
                        <span className="font-semibold text-red-500">{getFriendName(s.from)}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">pays <span className="font-bold text-lg">₹{s.amount.toFixed(2)}</span> to</span>
                        <span className="font-semibold text-green-500">{getFriendName(s.to)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            
            {/* Actions Section */}
            <section>
              <h3 className="text-2xl font-bold mb-4">Actions</h3>
              <div className="space-y-3">
                <button onClick={() => handleShare('email')} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <ShareIcon className="w-5 h-5 mr-2" /> Share via Email
                </button>
                <button onClick={() => handleShare('whatsapp')} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors">
                    <ShareIcon className="w-5 h-5 mr-2" /> Share on WhatsApp
                </button>
                <button onClick={() => { if(window.confirm('Are you sure you want to permanently delete this trip and all its expenses? This action cannot be undone.')) onDeleteTrip(trip.id)}} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors mt-4">
                    <TrashIcon className="w-5 h-5 mr-2" /> Delete Trip
                </button>
              </div>
            </section>
        </div>
      </div>
      
      {/* Add Expense Modal */}
      <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Add New Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Description (Optional)</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0.01" step="0.01" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Paid by</label>
            <select value={paidById} onChange={e => setPaidById(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              {tripMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Split with</label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md">
              {tripMembers.map(m => (
                <div key={m.id} className="flex items-center">
                  <input id={`split-${m.id}`} type="checkbox" checked={splitWith.includes(m.id)} onChange={() => handleSplitWithToggle(m.id)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                  <label htmlFor={`split-${m.id}`} className="ml-3 text-sm">{m.name}</label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-400" disabled={!amount || !paidById || splitWith.length === 0}>Add Expense</button>
          </div>
        </form>
      </Modal>

      {/* Edit Members Modal */}
       <Modal isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} title="Edit Trip Members">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Select friends to include in this trip. Note: You cannot remove members who are part of an existing expense.</p>
          <div className="max-h-60 overflow-y-auto space-y-2 p-2 border border-gray-300 dark:border-gray-600 rounded-md">
            {friends.map(friend => {
              const isInvolved = trip.expenses.some(exp => exp.paidById === friend.id || exp.splitWith.includes(friend.id));
              const isChecked = editableMembers.includes(friend.id);
              const isDisabled = isChecked && isInvolved;

              return (
                <div key={friend.id} className={`flex items-center ${isDisabled ? 'opacity-50' : ''}`}>
                  <input
                    id={`member-${friend.id}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMemberToggle(friend.id)}
                    disabled={isDisabled}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`member-${friend.id}`} className="ml-3 block text-sm text-gray-900 dark:text-gray-100">{friend.name}</label>
                  {isDisabled && <span className="ml-2 text-xs text-gray-400">(involved in expense)</span>}
                </div>
              )
            })}
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleUpdateMembers}
              className="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TripDetailScreen;
