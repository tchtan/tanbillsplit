import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Users, Plus, Trash2, DollarSign, List, X, ArrowRight } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  amount: number;
  sharedBy: string[]; // Array of person IDs who share this item
  paidBy: string; // Person ID who paid for this item
}

interface Person {
  id: string;
  name: string;
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

const Index = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const calculatePersonShare = (personId: string) => {
    return items.reduce((sum, item) => {
      if (item.sharedBy.includes(personId)) {
        return sum + (item.amount / item.sharedBy.length);
      }
      return sum;
    }, 0);
  };

  const calculatePersonPaid = (personId: string) => {
    return items.reduce((sum, item) => {
      if (item.paidBy === personId) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  };

  const calculateDebts = (): Debt[] => {
    const balances: { [personId: string]: number } = {};
    
    // Initialize balances
    persons.forEach(person => {
      balances[person.id] = 0;
    });

    // Calculate net balance for each person (what they paid minus what they owe)
    persons.forEach(person => {
      const paid = calculatePersonPaid(person.id);
      const owes = calculatePersonShare(person.id);
      balances[person.id] = paid - owes;
    });

    // Create debts array
    const debts: Debt[] = [];
    const creditors = persons.filter(p => balances[p.id] > 0.01).sort((a, b) => balances[b.id] - balances[a.id]);
    const debtors = persons.filter(p => balances[p.id] < -0.01).sort((a, b) => balances[a.id] - balances[b.id]);

    let i = 0, j = 0;
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];
      const amount = Math.min(balances[creditor.id], Math.abs(balances[debtor.id]));

      if (amount > 0.01) {
        debts.push({
          from: debtor.id,
          to: creditor.id,
          amount: amount
        });

        balances[creditor.id] -= amount;
        balances[debtor.id] += amount;
      }

      if (Math.abs(balances[creditor.id]) < 0.01) i++;
      if (Math.abs(balances[debtor.id]) < 0.01) j++;
    }

    return debts;
  };

  const handleAddItem = () => {
    if (newItemName.trim() && parseFloat(newItemAmount) > 0 && selectedPersons.length > 0 && selectedPayer) {
      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        amount: parseFloat(newItemAmount),
        sharedBy: selectedPersons,
        paidBy: selectedPayer,
      };
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemAmount('');
      setSelectedPersons([]);
      setSelectedPayer('');
      setShowItemDialog(false);
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
      };
      setPersons([...persons, newPerson]);
      setNewPersonName('');
    }
  };

  const handleDeletePerson = (id: string) => {
    setPersons(persons.filter(person => person.id !== id));
    // Remove this person from all items
    setItems(items.map(item => ({
      ...item,
      sharedBy: item.sharedBy.filter(personId => personId !== id),
      paidBy: item.paidBy === id ? '' : item.paidBy
    })).filter(item => item.sharedBy.length > 0 && item.paidBy));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setNewItemAmount(value);
  };

  const handlePersonSelect = (personId: string, checked: boolean) => {
    if (checked) {
      setSelectedPersons([...selectedPersons, personId]);
    } else {
      setSelectedPersons(selectedPersons.filter(id => id !== personId));
    }
  };

  const handleSelectAll = () => {
    if (selectedPersons.length === persons.length) {
      setSelectedPersons([]);
    } else {
      setSelectedPersons(persons.map(p => p.id));
    }
  };

  const openItemDialog = () => {
    setShowItemDialog(true);
    setSelectedPersons([]);
    setSelectedPayer('');
  };

  const debts = calculateDebts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            CheckBill
          </h1>
          <p className="text-xl text-blue-100 animate-fade-in">
            Split bills and calculate shares with ease
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Tabs Section */}
          <div className="space-y-6">
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
              <CardContent className="p-6">
                <Tabs defaultValue="items" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="items" className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Items
                    </TabsTrigger>
                    <TabsTrigger value="persons" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Persons
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="items" className="space-y-4 mt-4">
                    {/* Add Item Button */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Items to Share</Label>
                      <Button 
                        onClick={openItemDialog} 
                        className="w-full h-12"
                        disabled={persons.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Item
                      </Button>
                      {persons.length === 0 && (
                        <p className="text-sm text-gray-500 text-center">
                          Add people first to create items
                        </p>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <List className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No items added yet</p>
                        </div>
                      ) : (
                        items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                Shared by: {item.sharedBy.map(id => 
                                  persons.find(p => p.id === id)?.name
                                ).join(', ')}
                              </div>
                              <div className="text-xs text-blue-600 mt-1">
                                Paid by: {persons.find(p => p.id === item.paidBy)?.name}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-green-600">
                                {formatCurrency(item.amount)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="persons" className="space-y-4 mt-4">
                    {/* Add Person Form */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Add New Person</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Person name"
                          value={newPersonName}
                          onChange={(e) => setNewPersonName(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleAddPerson} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Persons List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {persons.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No people added yet</p>
                        </div>
                      ) : (
                        persons.map((person) => (
                          <div
                            key={person.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-800">{person.name}</span>
                              <div className="text-xs text-gray-500 mt-1">
                                Owes: {formatCurrency(calculatePersonShare(person.id))} | 
                                Paid: {formatCurrency(calculatePersonPaid(person.id))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePerson(person.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Calculator className="h-5 w-5 text-indigo-600" />
                  Bill Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Items:</span>
                    <span className="text-lg font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Number of People:</span>
                    <span className="text-lg font-medium">{persons.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-gray-200">
                    <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-gray-800">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Debts Card */}
            {debts.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <ArrowRight className="h-5 w-5 text-green-600" />
                    Who Owes Whom
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {debts.map((debt, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {persons.find(p => p.id === debt.from)?.name}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-800">
                          {persons.find(p => p.id === debt.to)?.name}
                        </span>
                      </div>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(debt.amount)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            <Button
              onClick={() => {
                setItems([]);
                setPersons([]);
                setNewItemName('');
                setNewItemAmount('');
                setNewPersonName('');
              }}
              variant="outline"
              className="w-full h-12 bg-white/20 border-white/30 text-white hover:bg-white/30 transition-all animate-scale-in"
            >
              Reset Calculator
            </Button>
          </div>
        </div>

        {/* Item Dialog */}
        {showItemDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Add New Item</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowItemDialog(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Amount (THB)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ฿
                    </span>
                    <Input
                      type="text"
                      placeholder="0.00"
                      value={newItemAmount}
                      onChange={handleAmountChange}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Who paid for this?</Label>
                  <Select value={selectedPayer} onValueChange={setSelectedPayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select who paid" />
                    </SelectTrigger>
                    <SelectContent>
                      {persons.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Who shares this item?</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedPersons.length === persons.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {persons.map((person) => (
                      <div key={person.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={person.id}
                          checked={selectedPersons.includes(person.id)}
                          onCheckedChange={(checked) => handlePersonSelect(person.id, checked as boolean)}
                        />
                        <Label htmlFor={person.id}>{person.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowItemDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItemName.trim() || !parseFloat(newItemAmount) || selectedPersons.length === 0 || !selectedPayer}
                    className="flex-1"
                  >
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
