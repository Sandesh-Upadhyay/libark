import { useState } from 'react';
import {
  useMyP2PBuyerPreferencesQuery,
  useUpdateP2PBuyerPreferenceMutation,
  useDeleteP2PBuyerPreferenceMutation,
  P2PPaymentMethodType,
  useFiatCurrenciesQuery,
} from '@libark/graphql-client';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';

import { Button } from '@/components/atoms/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/atoms/card';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/atoms/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { toast } from '@/lib/toast';

export function P2PSettingsForm() {
  const { data: prefData, loading: prefLoading, refetch } = useMyP2PBuyerPreferencesQuery();
  const { data: currencyData } = useFiatCurrenciesQuery();

  const [updatePreference, { loading: updating }] = useUpdateP2PBuyerPreferenceMutation();
  const [deletePreference, { loading: deleting }] = useDeleteP2PBuyerPreferenceMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: P2PPaymentMethodType.BankTransfer,
    fiatCurrency: 'JPY',
    minAmountUsd: '',
    maxAmountUsd: '',
  });

  const preferences = prefData?.myP2PBuyerPreferences || [];
  const currencies = currencyData?.fiatCurrencies || [];

  const handleSave = async () => {
    try {
      await updatePreference({
        variables: {
          input: {
            paymentMethod: formData.paymentMethod,
            fiatCurrency: formData.fiatCurrency,
            minAmountUsd: formData.minAmountUsd ? parseFloat(formData.minAmountUsd) : undefined,
            maxAmountUsd: formData.maxAmountUsd ? parseFloat(formData.maxAmountUsd) : undefined,
          },
        },
      });
      toast.success('設定を保存しました');
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to save preference', error);
      toast.error('設定の保存に失敗しました');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await deletePreference({
        variables: { id },
      });
      toast.success('設定を削除しました');
      refetch();
    } catch (error) {
      console.error('Failed to delete preference', error);
      toast.error('設定の削除に失敗しました');
    }
  };

  const handleEdit = (pref: any) => {
    setFormData({
      paymentMethod: pref.paymentMethod,
      fiatCurrency: pref.fiatCurrency,
      minAmountUsd: pref.minAmountUsd?.toString() || '',
      maxAmountUsd: pref.maxAmountUsd?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const paymentMethods = Object.values(P2PPaymentMethodType);

  if (prefLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-semibold'>購入設定</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData({
              paymentMethod: P2PPaymentMethodType.BankTransfer,
              fiatCurrency: 'JPY',
              minAmountUsd: '',
              maxAmountUsd: '',
            })}>
              <Plus className="mr-2 h-4 w-4" /> 新規設定を追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>購入設定の編集</DialogTitle>
              <DialogDescription>
                支払い方法ごとの優先設定を保存します。
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currency" className="text-right">通貨</Label>
                <div className="col-span-3">
                  <Select
                    value={formData.fiatCurrency}
                    onValueChange={(v) => setFormData({ ...formData, fiatCurrency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="通貨を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.symbol}) - {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment" className="text-right">支払い方法</Label>
                <div className="col-span-3">
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as P2PPaymentMethodType })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="支払い方法を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minAmount" className="text-right">最小金額(USD)</Label>
                <Input
                  id="minAmount"
                  type="number"
                  className="col-span-3"
                  value={formData.minAmountUsd}
                  onChange={(e) => setFormData({ ...formData, minAmountUsd: e.target.value })}
                  placeholder="制限なし"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxAmount" className="text-right">最大金額(USD)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  className="col-span-3"
                  value={formData.maxAmountUsd}
                  onChange={(e) => setFormData({ ...formData, maxAmountUsd: e.target.value })}
                  placeholder="制限なし"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={updating} loading={updating}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-4'>
        {preferences.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">設定がありません</p>
        ) : (
          preferences.map((pref: any) => (
            <Card key={pref.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">
                    {pref.fiatCurrency} - {pref.paymentMethod}
                  </CardTitle>
                  <CardDescription>
                    {pref.minAmountUsd ? `$${pref.minAmountUsd}` : '制限なし'} 〜
                    {pref.maxAmountUsd ? `$${pref.maxAmountUsd}` : '制限なし'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(pref)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(pref.id)} disabled={deleting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
