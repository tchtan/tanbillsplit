
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Users, Plus, Trash2, DollarSign, List } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  amount: number;
}

interface Person {
  id: string;
  name: string;
}

const Index = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [persons, setPersons] = useState<Person[]>([{ id: '1', name: 'Person 1' }]);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemAmount, setNewItemAmount] = useState<string>('');
  const [newPersonName, setNewPersonName] = useState<string>('');

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const sharePerPerson = persons.length > 0 ? totalAmount / persons.length : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleAddItem = () => {
    if (newItemName.trim() && parseFloat(newItemAmount) > 0) {
      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        amount: parseFloat(newItemAmount),
      };
      setItems([...items, newItem]);
      setNewItemName('');
      setNewItemAmount('');
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
    if (persons.length > 1) {
      setPersons(persons.filter(person => person.id !== id));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setNewItemAmount(value);
  };

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
                    {/* Add Item Form */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Add New Item</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Item name"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          className="flex-1"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            type="text"
                            placeholder="0.00"
                            value={newItemAmount}
                            onChange={handleAmountChange}
                            className="pl-8 w-24"
                          />
                        </div>
                        <Button onClick={handleAddItem} size="icon">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
                      {persons.map((person) => (
                        <div
                          key={person.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{person.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(sharePerPerson)}
                            </span>
                            {persons.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePerson(person.id)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
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

            {/* Per Person Card */}
            <Card className="backdrop-blur-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-2xl border-0 animate-scale-in">
              <CardHeader>
                <CardTitle className="text-white text-center">
                  Each Person Pays
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {formatCurrency(sharePerPerson)}
                  </div>
                  <div className="text-blue-100">
                    Split between {persons.length} {persons.length === 1 ? 'person' : 'people'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Button */}
            <Button
              onClick={() => {
                setItems([]);
                setPersons([{ id: '1', name: 'Person 1' }]);
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
      </div>
    </div>
  );
};

export default Index;
