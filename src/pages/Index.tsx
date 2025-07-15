import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Plus,
  Trash2,
  List,
  X,
  Loader2,
  ArrowRight,
  WalletMinimal,
  Send,
} from "lucide-react";
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
  color: string;
}
interface Debt {
  from: string;
  to: string;
  amount: number;
}
const Index = () => {
  // Load from localStorage or fallback to empty arrays
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem("billSplitItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [persons, setPersons] = useState<Person[]>(() => {
    const saved = localStorage.getItem("billSplitPersons");
    return saved ? JSON.parse(saved) : [];
  });

  const [isCalculating, setIsCalculating] = React.useState(false);
  const [debts, setDebts] = React.useState<Debt[]>([]);

  React.useEffect(() => {
    setIsCalculating(true);

    // simulate calculation delay with setTimeout
    setTimeout(() => {
      const result = calculateDebtsPaired(); // your calculation fn
      setDebts(result);
      setIsCalculating(false);
    }, 50); // 50ms delay just to show spinner, adjust or remove delay as you want
  }, [items, persons]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const jsonString = atob(decodeURIComponent(encodedData));
        const parsed = JSON.parse(jsonString);

        if (parsed.items && parsed.persons) {
          setItems(parsed.items);
          setPersons(parsed.persons);
        }
      } catch (error) {
        console.error("Invalid share data:", error);
      }
    }
  }, []);

  // Save items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("billSplitItems", JSON.stringify(items));
  }, [items]);

  // Save persons to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("billSplitPersons", JSON.stringify(persons));
  }, [persons]);
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemAmount, setNewItemAmount] = useState<string>("");
  const [newPersonName, setNewPersonName] = useState<string>("");
  const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<string>("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate debts - who owes whom and how much
  const calculateDebtsPaired = (): Debt[] => {
    const debtsMap: { [key: string]: number } = {}; // key: `${from}-${to}`

    // Step 1: Build debts map as before
    items.forEach((item) => {
      const shareAmount = item.amount / item.sharedBy.length;
      const payer = item.paidBy;

      item.sharedBy.forEach((personId) => {
        if (personId !== payer) {
          const key = `${personId}-${payer}`;
          debtsMap[key] = (debtsMap[key] || 0) + shareAmount;
        }
      });
    });

    // Step 2: Pair debts and net them
    const processed = new Set<string>();
    const result: Debt[] = [];

    Object.entries(debtsMap).forEach(([key, amount]) => {
      if (processed.has(key)) return;

      const [from, to] = key.split("-");
      const reverseKey = `${to}-${from}`;
      const reverseAmount = debtsMap[reverseKey] || 0;

      if (reverseAmount > 0) {
        // Net amounts
        if (amount > reverseAmount) {
          result.push({
            from,
            to,
            amount: Math.round((amount - reverseAmount) * 100) / 100,
          });
        } else if (reverseAmount > amount) {
          result.push({
            from: to,
            to: from,
            amount: Math.round((reverseAmount - amount) * 100) / 100,
          });
        }
        // Mark both keys as processed
        processed.add(key);
        processed.add(reverseKey);
      } else {
        // No reverse debt, just add this debt
        result.push({ from, to, amount: Math.round(amount * 100) / 100 });
        processed.add(key);
      }
    });

    return result;
  };

  const handleAddItem = () => {
    if (
      newItemName.trim() &&
      parseFloat(newItemAmount) > 0 &&
      selectedPersons.length > 0 &&
      selectedPayer
    ) {
      if (editingItem) {
        // Update existing item
        setItems(
          items.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  name: newItemName.trim(),
                  amount: parseFloat(newItemAmount),
                  sharedBy: selectedPersons,
                  paidBy: selectedPayer,
                }
              : item
          )
        );
      } else {
        // Add new item
        const newItem: Item = {
          id: Date.now().toString(),
          name: newItemName.trim(),
          amount: parseFloat(newItemAmount),
          sharedBy: selectedPersons,
          paidBy: selectedPayer,
        };
        setItems([...items, newItem]);
      }
      setNewItemName("");
      setNewItemAmount("");
      setSelectedPersons([]);
      setSelectedPayer("");
      setEditingItem(null);
      setShowItemDialog(false);
    }
  };
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemAmount(item.amount.toString());
    setSelectedPersons(item.sharedBy);
    setSelectedPayer(item.paidBy);
    setShowItemDialog(true);
  };
  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
        color: pickNextAvailableColor(),
      };
      setPersons([...persons, newPerson]);
      setNewPersonName("");
    }
  };
  const handleDeletePerson = (id: string) => {
    setPersons(persons.filter((person) => person.id !== id));
    // Remove this person from all items
    setItems(
      items
        .map((item) => ({
          ...item,
          sharedBy: item.sharedBy.filter((personId) => personId !== id),
          paidBy: item.paidBy === id ? "" : item.paidBy,
        }))
        .filter((item) => item.sharedBy.length > 0 && item.paidBy)
    );
  };
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setNewItemAmount(value);
  };
  const handlePersonSelect = (personId: string, checked: boolean) => {
    if (checked) {
      setSelectedPersons([...selectedPersons, personId]);
    } else {
      setSelectedPersons(selectedPersons.filter((id) => id !== personId));
    }
  };
  const handleSelectAll = () => {
    if (selectedPersons.length === persons.length) {
      setSelectedPersons([]);
    } else {
      setSelectedPersons(persons.map((p) => p.id));
    }
  };
  const openItemDialog = () => {
    setEditingItem(null);
    setNewItemName("");
    setNewItemAmount("");
    setShowItemDialog(true);
    setSelectedPersons([]);
    setSelectedPayer("");
  };
  // const debts = React.useMemo(() => calculateDebtsPaired(), [items, persons]);
  const colors = [
    "bg-green-200 text-green-800",
    "bg-blue-200 text-blue-800",
    "bg-purple-200 text-purple-800",
    "bg-pink-200 text-pink-800",
    "bg-yellow-200 text-yellow-800",
    "bg-red-200 text-red-800",
    "bg-indigo-200 text-indigo-800",
    "bg-teal-200 text-teal-800",
  ];

  const pickNextAvailableColor = (): string => {
    const usedColors = persons.map((p) => p.color);
    const availableColors = colors.filter((c) => !usedColors.includes(c));
    // If all colors are used, just cycle back to first
    return availableColors.length > 0
      ? availableColors[0]
      : colors[persons.length % colors.length];
  };

  const shortenUrl = async (longUrl: string): Promise<string> => {
    try {
      const res = await fetch(
        `https://is.gd/create.php?format=simple&url=${encodeURIComponent(
          longUrl
        )}`
      );
      if (!res.ok) throw new Error("Failed to shorten URL");
      const shortUrl = await res.text();
      return shortUrl;
    } catch (error) {
      console.error("URL shortening error:", error);
      return longUrl; // fallback
    }
  };

  const generateShareLink = async () => {
    const data = {
      items,
      persons,
    };
    const jsonString = JSON.stringify(data);
    const encoded = encodeURIComponent(btoa(jsonString)); // your encoding
    const longUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

    const shortUrl = await shortenUrl(longUrl);

    navigator.clipboard
      .writeText(shortUrl)
      .then(() => alert("Share link copied to clipboard!"))
      .catch(() => alert("Failed to copy link."));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-300 to-amber-200 p-4 font-inter">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in drop-shadow-lg">
            Bill Split
          </h1>
        </div>

        <div className="grid gap-8">
          {/* Main Tabs Section */}
          <div className="space-y-4">
            <Card className="glass-card shadow-2xl border-0 animate-scale-in p-6 space-y-6">
              {/* Persons Bar */}
              <div>
                <div className="flex items-end justify-between mb-6">
                  <Label className="block text-lg font-semibold text-gray-700">
                    Persons
                  </Label>
                  {/* Add Person Input + Button */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add person"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      className="w-32 bg-white placeholder:text-gray-300"
                    />
                    <Button
                      onClick={handleAddPerson}
                      size="icon"
                      aria-label="Add person"
                      className="drop-shadow"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  {persons.map((person) => (
                    <div
                      key={person.id}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg shadow-inner cursor-default select-none transition-colors hover:brightness-90 ${person.color}`}
                      title={person.name}
                    >
                      <span className="font-medium text-sm">{person.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePerson(person.id)}
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0"
                        aria-label={`Delete ${person.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items List Section */}
              <div className="m-0">
                <div className="flex justify-between items-end mb-4">
                  <Label className="text-gray-700 font-semibold text-lg">
                    Shared Items
                  </Label>
                  <Button
                    onClick={openItemDialog}
                    className="h-9 drop-shadow"
                    disabled={persons.length === 0}
                    title={persons.length === 0 ? "Add people first" : ""}
                  >
                    <Plus className="h-4 w-4" />
                    Add New Item
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <List className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleEditItem(item)}
                        className="flex flex-col p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer "
                      >
                        {/* Name + Price */}
                        <div className="flex justify-between items-start w-full">
                          <span className="font-medium text-gray-800">
                            {item.name}
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>

                        {/* Shared by + Paid by */}
                        <div className="relative w-full text-xs text-gray-500 mt-1">
                          <div className="flex flex-wrap items-center gap-1 pr-28">
                            {" "}
                            {/* Reserve space for Paid by */}
                            <Users className="h-4 w-4 shrink-0" />
                            {item.sharedBy.map((id) => {
                              const person = persons.find((p) => p.id === id);
                              if (!person) return null;
                              return (
                                <span
                                  key={id}
                                  className={`px-2 py-0.5 rounded-sm font-medium shadow-inner ${person.color}`}
                                >
                                  {person.name}
                                </span>
                              );
                            })}
                          </div>
                          <div className="absolute top-0 right-0 flex items-center gap-1">
                            <WalletMinimal className="h-4 w-4 shrink-0" />
                            {persons.find((p) => p.id === item.paidBy) && (
                              <span
                                className={`px-2 py-0.5 rounded-sm font-medium shadow-inner ${
                                  persons.find((p) => p.id === item.paidBy)
                                    ?.color
                                }`}
                              >
                                {
                                  persons.find((p) => p.id === item.paidBy)
                                    ?.name
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Debts Card */}
            {debts.length > 0 && (
              <Card className="glass-card shadow-2xl border-0">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-foreground">Balance</CardTitle>
                    {isCalculating ? (
                      <div className="animate-spin w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full"></div>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {debts.map((debt, index) => {
                    const fromPerson = persons.find((p) => p.id === debt.from);
                    const toPerson = persons.find((p) => p.id === debt.to);

                    return (
                      <div
                        key={index}
                        className="flex flex-wrap justify-between items-center p-3 rounded-lg bg-orange-100 shadow-inner"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {fromPerson?.name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-orange-400" />
                          <span className="font-semibold text-gray-800">
                            {toPerson?.name}
                          </span>
                        </div>
                        <span className="font-bold text-orange-600 text-base">
                          {debt.amount}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Reset Button */}
            <div className="flex flex-row rounded-lg cursor-pointer gap-3">
              <Button
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to reset everything?")
                  ) {
                    setItems([]);
                    setPersons([]);
                    localStorage.removeItem("billSplitItems");
                    localStorage.removeItem("billSplitPersons");
                    setNewItemName("");
                    setNewItemAmount("");
                    setNewPersonName("");
                  }
                }}
                // variant="outline"
                className="w-full h-10 shadow-inner"
              >
                Reset Calculator
              </Button>
              <Button
                onClick={generateShareLink}
                className="w-12 h-10 bg-white text-orange-600 shadow-inner hover:bg-orange-100"
              >
                <Send className="items-center"></Send>
              </Button>
            </div>
          </div>
        </div>

        {/* Item Dialog */}
        {showItemDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md glass-dialog">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </CardTitle>
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
                  <Select
                    value={selectedPayer}
                    onValueChange={setSelectedPayer}
                  >
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
                      {selectedPersons.length === persons.length
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {persons.map((person) => (
                      <label
                        htmlFor={person.id}
                        className="flex items-center space-x-3 cursor-pointer py-2"
                      >
                        <div className="scale-125 ml-2">
                          <Checkbox
                            id={person.id}
                            checked={selectedPersons.includes(person.id)}
                            onCheckedChange={(checked) =>
                              handlePersonSelect(person.id, checked as boolean)
                            }
                          />
                        </div>
                        <span>{person.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowItemDialog(false);
                      setEditingItem(null);
                      setNewItemName("");
                      setNewItemAmount("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    className="flex-1"
                    disabled={
                      !newItemName.trim() ||
                      !newItemAmount ||
                      selectedPersons.length === 0 ||
                      !selectedPayer
                    }
                  >
                    {editingItem ? "Update Item" : "Add Item"}
                  </Button>
                  {editingItem && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this item?"
                          )
                        ) {
                          handleDeleteItem(editingItem.id);
                          setShowItemDialog(false);
                          setEditingItem(null);
                        }
                      }}
                      aria-label="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
