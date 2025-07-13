
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Calculator, Users, Percent, DollarSign } from 'lucide-react';

const Index = () => {
  const [billAmount, setBillAmount] = useState<string>('');
  const [tipPercentage, setTipPercentage] = useState<number>(18);
  const [customTip, setCustomTip] = useState<string>('');
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);

  const billValue = parseFloat(billAmount) || 0;
  const tipValue = isCustomTip ? (parseFloat(customTip) || 0) : tipPercentage;
  const tipAmount = (billValue * tipValue) / 100;
  const totalAmount = billValue + tipAmount;
  const perPersonAmount = totalAmount / numberOfPeople;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleBillAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setBillAmount(value);
  };

  const handleCustomTipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomTip(value);
  };

  const quickTipButtons = [15, 18, 20, 25];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            CheckBill
          </h1>
          <p className="text-xl text-blue-100 animate-fade-in">
            Split bills and calculate tips with ease
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Bill Amount Card */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Bill Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    $
                  </span>
                  <Input
                    type="text"
                    placeholder="0.00"
                    value={billAmount}
                    onChange={handleBillAmountChange}
                    className="pl-8 text-lg h-12 border-2 focus:border-blue-500 transition-colors"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tip Section Card */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Percent className="h-5 w-5 text-blue-600" />
                  Tip Amount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Tip Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {quickTipButtons.map((tip) => (
                    <Button
                      key={tip}
                      variant={!isCustomTip && tipPercentage === tip ? "default" : "outline"}
                      onClick={() => {
                        setTipPercentage(tip);
                        setIsCustomTip(false);
                      }}
                      className="h-10 transition-all hover:scale-105"
                    >
                      {tip}%
                    </Button>
                  ))}
                </div>

                {/* Tip Slider */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">
                    Tip: {isCustomTip ? customTip : tipPercentage}%
                  </Label>
                  <Slider
                    value={[isCustomTip ? parseFloat(customTip) || 0 : tipPercentage]}
                    onValueChange={(value) => {
                      setTipPercentage(value[0]);
                      setIsCustomTip(false);
                    }}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Custom Tip Input */}
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600 whitespace-nowrap">Custom:</Label>
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="0"
                      value={customTip}
                      onChange={handleCustomTipChange}
                      onFocus={() => setIsCustomTip(true)}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Number of People Card */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800">
                  <Users className="h-5 w-5 text-purple-600" />
                  Number of People
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                    className="h-10 w-10 rounded-full transition-all hover:scale-110"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-semibold text-gray-800">
                      {numberOfPeople}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setNumberOfPeople(numberOfPeople + 1)}
                    className="h-10 w-10 rounded-full transition-all hover:scale-110"
                  >
                    +
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
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
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-lg font-medium">{formatCurrency(billValue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Tip ({isCustomTip ? customTip : tipPercentage}%):</span>
                    <span className="text-lg font-medium text-green-600">{formatCurrency(tipAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-gray-200">
                    <span className="text-lg font-semibold text-gray-800">Total:</span>
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
                    {formatCurrency(perPersonAmount)}
                  </div>
                  <div className="text-blue-100">
                    Split between {numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reset Button */}
            <Button
              onClick={() => {
                setBillAmount('');
                setTipPercentage(18);
                setCustomTip('');
                setNumberOfPeople(1);
                setIsCustomTip(false);
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
