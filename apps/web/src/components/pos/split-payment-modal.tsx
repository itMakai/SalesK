import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Phone, CreditCard, Loader2 } from "lucide-react";

interface SplitPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onProcessSplit: (payments: { method: string; amount: number; phone?: string; email?: string }[]) => Promise<void>;
  isProcessing: boolean;
}

export function SplitPaymentModal({ open, onOpenChange, totalAmount, onProcessSplit, isProcessing }: SplitPaymentModalProps) {
  const [cashAmount, setCashAmount] = useState<string>("");
  const [mpesaAmount, setMpesaAmount] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  
  const [mpesaPhone, setMpesaPhone] = useState<string>("");
  const [cardEmail, setCardEmail] = useState<string>("");

  const cash = parseFloat(cashAmount) || 0;
  const mpesa = parseFloat(mpesaAmount) || 0;
  const card = parseFloat(cardAmount) || 0;
  
  const currentTotal = cash + mpesa + card;
  const remaining = totalAmount - currentTotal;
  
  const isValid = Math.abs(currentTotal - totalAmount) < 0.01 && 
                  (mpesa > 0 ? mpesaPhone.length >= 9 : true) &&
                  (card > 0 ? cardEmail.length > 5 && cardEmail.includes('@') : true);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    const payments = [];
    if (cash > 0) payments.push({ method: 'cash', amount: cash });
    if (mpesa > 0) payments.push({ method: 'mpesa', amount: mpesa, phone: mpesaPhone });
    if (card > 0) payments.push({ method: 'card', amount: card, email: cardEmail });
    
    await onProcessSplit(payments);
  };

  const autofillRemaining = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (remaining > 0) {
      setter(remaining.toString());
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isProcessing && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md mb-2">
            <span className="font-medium">Total Due:</span>
            <span className="font-bold text-lg">Ksh {totalAmount.toLocaleString()}</span>
          </div>

          {/* Cash */}
          <div className="border rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-4 h-4 text-muted-foreground" />
              <Label className="font-semibold">Cash Amount</Label>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button type="button" variant="secondary" onClick={() => autofillRemaining(setCashAmount)} disabled={isProcessing || remaining <= 0}>
                Max
              </Button>
            </div>
          </div>

          {/* M-Pesa */}
          <div className="border rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-[#4CAF50]" />
              <Label className="font-semibold">M-Pesa Amount</Label>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="0"
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button type="button" variant="secondary" onClick={() => autofillRemaining(setMpesaAmount)} disabled={isProcessing || remaining <= 0}>
                Max
              </Button>
            </div>
            {mpesa > 0 && (
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground mb-1 block">Phone Number (Required)</Label>
                <Input
                  type="tel"
                  placeholder="07XX XXX XXX"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Card (PayStack) */}
          <div className="border rounded-md p-3">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[#0BA4DB]" />
              <Label className="font-semibold">Card Amount</Label>
            </div>
            <div className="flex gap-2 mb-2">
              <Input
                type="number"
                placeholder="0"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
                disabled={isProcessing}
              />
              <Button type="button" variant="secondary" onClick={() => autofillRemaining(setCardAmount)} disabled={isProcessing || remaining <= 0}>
                Max
              </Button>
            </div>
            {card > 0 && (
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground mb-1 block">Customer Email (Required)</Label>
                <Input
                  type="email"
                  placeholder="customer@example.com"
                  value={cardEmail}
                  onChange={(e) => setCardEmail(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
            )}
          </div>
          
          <div className={`flex justify-between items-center p-3 rounded-md ${remaining === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : remaining < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-muted/50'}`}>
            <span className="font-medium">Remaining:</span>
            <span className="font-bold">Ksh {Math.abs(remaining).toLocaleString()} {remaining < 0 ? '(Overpaid)' : ''}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing || !isValid}>
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
