import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Users,
  Plus,
  Trash2,
  List,
  X,
  ArrowRight,
  WalletMinimal,
  Send,
  ListRestart,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
} from "lucide-react";
interface Item {
  id: string;
  name: string;
  amount: number;
  sharedBy: string[]; // Array of person IDs who share this item
  paidBy: string; // Person ID who paid for this item
  vat7?: boolean;
  serviceCharge10?: boolean;
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
  const [newItemName, setNewItemName] = useState<string>("");
  const [modalItemName, setModalItemName] = useState<string>("");
  const [newItemAmount, setNewItemAmount] = useState<string>("");
  const [newPersonName, setNewPersonName] = useState<string>("");
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [selectedPayer, setSelectedPayer] = useState<string>("");
  const [vat7, setVat7] = useState(false);
  const [serviceCharge10, setServiceCharge10] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [debts, setDebts] = React.useState<Debt[]>([]);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [shortenUrl, setShortenUrl] = useState("");
  const amountRef = useRef<HTMLInputElement>(null);
  const copyBtnRef = useRef<HTMLButtonElement>(null);

  // Load from localStorage or fallback to empty arrays
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem("billSplitItems");
    return saved ? JSON.parse(saved) : [];
  });

  const [persons, setPersons] = useState<Person[]>(() => {
    const saved = localStorage.getItem("billSplitPersons");
    return saved ? JSON.parse(saved) : [];
  });

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
    if (showCopyModal && copyBtnRef.current) {
      copyBtnRef.current.click();
    }
  }, [showCopyModal]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const jsonString = safeBase64Decode(decodeURIComponent(encodedData)); // 👈 SAFE DECODE
        const parsed = JSON.parse(jsonString);
        console.log("Parsed share data:", parsed);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  const calculateDebtsPaired = (): Debt[] => {
    const debtsMap: { [key: string]: number } = {}; // key: `${from}-${to}`

    // Step 1: Build debts map as before
    items.forEach((item) => {
      const adjustedAmount = getAdjustedAmount(item);
      const shareAmount = adjustedAmount / item.sharedBy.length;
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
      modalItemName.trim() &&
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
                  name: modalItemName.trim(),
                  amount: parseFloat(newItemAmount),
                  sharedBy: selectedPersons,
                  paidBy: selectedPayer,
                  vat7,
                  serviceCharge10,
                }
              : item
          )
        );
      } else {
        // Add new item
        const newItem: Item = {
          id: Date.now().toString(),
          name: modalItemName.trim(),
          amount: parseFloat(newItemAmount),
          sharedBy: selectedPersons,
          paidBy: selectedPayer,
          vat7,
          serviceCharge10,
        };
        setItems([...items, newItem]);
      }
      setNewItemName("");
      setModalItemName("");
      setNewItemAmount("");
      setSelectedPersons([]);
      setSelectedPayer("");
      setVat7(false);
      setServiceCharge10(false);
      setEditingItem(null);
      setShowItemDialog(false);
    }
  };
  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };
  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setModalItemName(item.name);
    setNewItemAmount(item.amount.toString());
    setSelectedPersons(item.sharedBy);
    setSelectedPayer(item.paidBy);
    setVat7(item.vat7 || false);
    setServiceCharge10(item.serviceCharge10 || false);
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
    const involvedItems = items.filter(
      (item) => item.paidBy === id || item.sharedBy.includes(id)
    );

    if (involvedItems.length > 0) {
      const confirmed = window.confirm(
        `They’re linked to ${involvedItems.length} item${
          involvedItems.length > 1 ? "s" : ""
        }.\n` +
          `Removing this person might change or delete ${involvedItems.length > 1 ? "them" : "it"}.`
      );
      if (!confirmed) return; // Exit if user cancels
    }
    deletePerson(id);
  };
  const deletePerson = (id: string) => {
    setPersons(persons.filter((person) => person.id !== id));
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
  let touchTriggered = false;
  const handleOpenModal = () => {
    setModalItemName(newItemName);
    setNewItemAmount(null);
    setSelectedPersons([]);
    setSelectedPayer("");
    setVat7(false);
    setServiceCharge10(false);
    setShowItemDialog(true);
    setNewItemName("");
    setEditingItem(null);
  };
  const handleTouchStart = () => {
    touchTriggered = true;
    handleOpenModal();

    setTimeout(() => {
      amountRef.current?.focus();
    }, 100);
  };
  const handleClick = () => {
    if (touchTriggered) {
      touchTriggered = false;
      return;
    }
    handleOpenModal();
  };
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
  const safeBase64Encode = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
  };
  const safeBase64Decode = (str: string): string => {
    return decodeURIComponent(escape(atob(str)));
  };
  const shortenWithBitly = async (longUrl: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ long_url: longUrl }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Bitly error:", data.error);
        return null;
      }

      return data.link;
    } catch (err) {
      console.error("Network error:", err);
      return null;
    }
  };
  const generateShareLink = async () => {
    const data = { items, persons };
    const jsonString = JSON.stringify(data);
    const encoded = encodeURIComponent(safeBase64Encode(jsonString));
    const longUrl = `${window.location.origin}${window.location.pathname}?data=${encoded}`;

    let shortenUrl = longUrl;
    try {
      const shortUrl = await shortenWithBitly(longUrl);
      if (shortUrl) shortenUrl = shortUrl;

      setShortenUrl(shortenUrl || longUrl);
    } catch {
      setShortenUrl(longUrl);
    } finally {
      setShowCopyModal(true);
    }
  };
  const handleManualCopy = () => {
    console.log("handleManualCopy fired");
    if (!shortenUrl) {
      console.warn("shortenUrl is missing");
      return;
    }

    navigator.clipboard
      .writeText(shortenUrl)
      .then(() => {
        console.log("Copied to clipboard:", shortenUrl);
        alert("Share link copied to clipboard!");
        setShowCopyModal(false);
      })
      .catch((err) => {
        console.error("Clipboard error", err);
      });
  };

  const getAdjustedAmount = (item: Item) => {
    let adjusted = item.amount;
    if (item.vat7) adjusted *= 1.07;
    if (item.serviceCharge10) adjusted *= 1.1;
    return adjusted;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 p-4 font-sans">
      <div className="flex-1 flex items-start justify-center p-2">
        <div className="w-full max-w-4xl flex flex-col items-stretch">
          {/* Header */}
          <div className="flex items-center gap-1 py-4">
            {/* Toggle button */}
            <button
              onClick={() => setHeaderOpen(!headerOpen)}
              className={`flex items-center px-3 py-2 rounded-lg shadow-2xl transition-all bg-orange-400 ${
                headerOpen ? "opacity-60" : "opacity-100"
              }`}
            >
              <span className="font-semibold text-white p-1">Bill Split</span>
              {headerOpen ? (
                <ChevronLeft className="h-6 w-6 text-white" />
              ) : (
                <ChevronRight className="h-6 w-6 text-white" />
              )}
            </button>

            {/* Slide-out actions container with background */}
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 bg-orange-200 transition-all duration-300 ease-in-out transform origin-left ${
                headerOpen
                  ? "opacity-100 scale-x-100 ml-2"
                  : "opacity-0 scale-x-0 ml-0"
              }`}
            >
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
                    setModalItemName("");
                    setNewItemAmount("");
                    setNewPersonName("");
                  }
                }}
                className="w-24 h-9 drop-shadow-sm bg-orange-400"
              >
                <ListRestart className="scale-125" />
                <p className="font-semibold text-sm">Reset</p>
              </Button>
              <Button
                onClick={generateShareLink}
                className="w-12 h-9 bg-white drop-shadow-sm text-orange-500 hover:bg-orange-100"
              >
                <Send className="scale-125" />
              </Button>
            </div>
          </div>
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
                      className="w-32 bg-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={handleAddPerson}
                      size="icon"
                      aria-label="Add person"
                      className="drop-shadow"
                      disabled={!newPersonName.trim()} // 👈 Disable when input is empty
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {persons.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No persons added yet</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 items-center mb-4">
                  {persons.map((person) => (
                    <div
                      key={person.id}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-inner cursor-default select-none transition-colors hover:brightness-90 ${person.color}`}
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
              <div className="border-t border-gray-200 opacity-50 -mx-6" />
              {/* Items List Section */}
              <div className="m-0">
                <div className="flex justify-between items-end mb-4">
                  <Label className="text-gray-700 font-semibold text-lg">
                    Shared Items
                  </Label>
                  {/* Add Item Input + Button */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Add Item"
                      className="w-32 bg-white placeholder:text-gray-400"
                    />
                    <Button
                      disabled={!newItemName.trim()}
                      onTouchStart={handleTouchStart}
                      onClick={handleClick}
                      size="icon"
                      className="drop-shadow"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <List className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleEditItem(item)}
                        style={{ backgroundColor: "#f1f8ff" }}
                        className="flex flex-col p-3 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer shadow-inner"
                      >
                        {/* Name + Price */}
                        <div className="flex justify-between items-start w-full">
                          <span className="font-medium text-gray-800">
                            {item.name}
                          </span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(getAdjustedAmount(item))}
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
            {debts.length > 0 ? (
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
                          {formatCurrency(debt.amount)}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <div className="" />
            )}
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
                className="h-8 w-8 rounded-full bg-orange-50 text-orange-500 hover:bg-orange-100 active:bg-orange-200 shadow transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="Item name"
                  value={modalItemName}
                  onChange={(e) => setModalItemName(e.target.value)}
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                {/* Label + Toggles in same row */}
                <div className="flex justify-between items-center">
                  <Label>Amount (THB)</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVat7(!vat7)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        vat7
                          ? "bg-orange-200 text-orange-800 shadow-inner"
                          : "bg-gray-200 text-gray-600 opacity-60"
                      }`}
                    >
                      VAT 7%
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceCharge10(!serviceCharge10)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        serviceCharge10
                          ? "bg-orange-200 text-orange-800 shadow-inner"
                          : "bg-gray-200 text-gray-600 opacity-60"
                      }`}
                    >
                      SC 10%
                    </button>
                  </div>
                </div>

                {/* Full-width amount input */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ฿
                  </span>
                  <Input
                    ref={amountRef}
                    type="text"
                    inputMode="decimal" // helps on mobile keyboards
                    pattern="[0-9]*" // iOS-specific help
                    step="0.01" // optional for decimals
                    placeholder="0.00"
                    value={newItemAmount}
                    onChange={handleAmountChange}
                    className="pl-8 bg-white w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pt-1 pb-2">
                  <Label>Who paid for this?</Label>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {persons.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setSelectedPayer(person.id)}
                      className={`px-4 py-1 rounded-lg shadow-inner transition-all transform ${
                        person.color
                      } ${
                        selectedPayer === person.id
                          ? "shadow-inner"
                          : "opacity-40"
                      }`}
                    >
                      <span className="text-sm font-medium">{person.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Who shares this item?</Label>
                  <Button
                    variant="outlineNoHover"
                    className={`gap-1 ${
                      selectedPersons.length === persons.length
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedPersons.length === persons.length ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        All
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        All
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {persons.map((person) => {
                    const isSelected = selectedPersons.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() =>
                          handlePersonSelect(person.id, !isSelected)
                        }
                        className={`px-4 py-1 rounded-lg shadow-inner transition-all transform ${
                          person.color
                        } ${isSelected ? "shadow-inner" : "opacity-40"}`}
                      >
                        <span className="text-sm font-medium">
                          {person.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowItemDialog(false);
                    setEditingItem(null);
                    setNewItemName("");
                    setModalItemName("");
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
                    !modalItemName.trim() ||
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
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm p-4 glass-dialog">
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold mb-4">Shareable Link</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCopyModal(false)}
                className="h-6 w-6 rounded-full bg-orange-50 text-orange-500 shadow transition-colors"
              >
              <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3">
              <Input
                type="text"
                readOnly
                value={shortenUrl}
                className="w-full text-sm text-gray-700 shadow-inner"
              />
              <Button
                variant="outline"
                ref={copyBtnRef}
                onClick={handleManualCopy}
                className="bg-orange-400 hover:bg-orange-500 text-white"
              >
                Copy
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Index;
