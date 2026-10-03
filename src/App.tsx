/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Lock, 
  LogOut, 
  Plus, 
  Minus,
  Scale, 
  Search, 
  Coins, 
  FileText,
  AlertCircle,
  Printer,
  Sliders,
  Database,
  CheckCircle2,
  X,
  Trash2,
  Edit2,
  Check,
  ChevronLeft,
  Calendar,
  Share2,
  Download,
  Tag,
  Clock,
  Calculator,
  Building2,
  CreditCard,
  Wallet,
  PieChart,
  AlertTriangle
} from 'lucide-react';
import { supabase, DbCustomer, DbTransaction, DbCompanySettings } from './lib/supabase';

// Core Interfaces
interface Customer {
  id: string;
  name: string;
  mobile: string;
  password?: string; // custom or default '1234'
  walletCash: number; // in Tomans
  copperBalance: number; // in kg
  sharePercentage: number; // % of total copper pool
  realizedProfit: number; // in Tomans
  profitChangePercent: number; // e.g. 17.3
  averageBuyPrice: number; // in Tomans/kg
  inTransitChecks: number; // "اسناد درراه" in Tomans
  blockedCopper: number; // "مسدود مس" count
}

interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdraw' | 'check_register' | 'adjustment';
  date: string;
  time?: string;
  amountKg?: number;
  ratePerKg?: number;
  totalAmount: number; // in Tomans
  status: 'completed' | 'pending';
  description?: string;
  checkNumber?: string; // for check register
  afterWalletCash?: number; // wallet balance after transaction
  profitVal?: number; // profit achieved
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'جواد شکرالهی',
    mobile: '09127697501',
    walletCash: 917370000,
    copperBalance: 250.86,
    sharePercentage: 35.6,
    realizedProfit: 416555354,
    profitChangePercent: 17.3,
    averageBuyPrice: 2000000,
    inTransitChecks: 514800000,
    blockedCopper: 1,
  },
  {
    id: 'c2',
    name: 'علی ظفری پور',
    mobile: '09134263654',
    walletCash: 0,
    copperBalance: 310.94,
    sharePercentage: 44.1,
    realizedProfit: 8502093,
    profitChangePercent: 0.9,
    averageBuyPrice: 2120000,
    inTransitChecks: 0,
    blockedCopper: 0,
  },
  {
    id: 'c3',
    name: 'سعید صمیمی پور',
    mobile: '09379900697',
    walletCash: 500000000,
    copperBalance: 0,
    sharePercentage: 0,
    realizedProfit: 0,
    profitChangePercent: 0,
    averageBuyPrice: 0,
    inTransitChecks: 0,
    blockedCopper: 0,
  },
  {
    id: 'c4',
    name: 'مرتضی محمدی',
    mobile: '09123456789',
    walletCash: 0,
    copperBalance: 143.12,
    sharePercentage: 20.3,
    realizedProfit: 174560000,
    profitChangePercent: 12.5,
    averageBuyPrice: 1950000,
    inTransitChecks: 0,
    blockedCopper: 0,
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    customerId: 'c1',
    customerName: 'جواد شکرالهی',
    type: 'buy',
    date: '۱۴۰۵/۰۶/۱۶',
    time: '۰۹:۰۰:۳۶',
    amountKg: 68.31,
    ratePerKg: 3100000,
    totalAmount: 211765000,
    status: 'completed',
    description: 'خرید لوله مسی - فروشنده انبار شرکت مس و اته',
    afterWalletCash: 917370000,
  },
  {
    id: 't2',
    customerId: 'c1',
    customerName: 'جواد شکرالهی',
    type: 'sell',
    date: '۱۴۰۵/۰۶/۱۵',
    time: '۰۹:۰۰:۳۶',
    amountKg: 29.10,
    ratePerKg: 3200000,
    totalAmount: 93120000,
    status: 'completed',
    description: 'فروش خارجی (به خریدار بیرونی)',
    afterWalletCash: 1129135000,
    profitVal: 15421111,
  },
  {
    id: 't3',
    customerId: 'c1',
    customerName: 'جواد شکرالهی',
    type: 'sell',
    date: '۱۴۰۵/۰۶/۱۵',
    time: '۰۹:۰۰:۳۶',
    amountKg: 260,
    ratePerKg: 2900000,
    totalAmount: 754000000,
    status: 'completed',
    description: 'فروش به خارج (خریدار بیرونی) درخواست فروش ۲۶۰ کیلوگرم لوله مسی با نرخ ۲,۹۰۰,۰۰۰ تومان',
    afterWalletCash: 1036015000,
    profitVal: 59783118,
  },
  {
    id: 't4',
    customerId: 'c1',
    customerName: 'جواد شکرالهی',
    type: 'sell',
    date: '۱۴۰۵/۰۶/۱۵',
    time: '۰۹:۰۰:۳۶',
    amountKg: 4.40,
    ratePerKg: 2950000,
    totalAmount: 12980000,
    status: 'completed',
    description: 'فروش لوله مسی (تحویل به شرکت) درخواست فروش ۴.۴۰ کیلوگرم لوله مسی با نرخ ۲,۹۵۰,۰۰۰ تومان',
    afterWalletCash: 282015000,
    profitVal: 1231714,
  },
  {
    id: 't5',
    customerId: 'c1',
    customerName: 'جواد شکرالهی',
    type: 'check_register',
    date: '۱۴۰۵/۰۷/۰۵',
    time: '۱۲:۳۰:۰۰',
    totalAmount: 514800000,
    status: 'completed',
    description: 'سند اسناد درراه - ۱ چک مسدود لوله مسی',
    checkNumber: '۴۲۰۴/۵۶۲/۱۲',
    afterWalletCash: 917370000,
  },
  {
    id: 't6',
    customerId: 'c3',
    customerName: 'سعید صمیمی پور',
    type: 'deposit',
    date: '۱۴۰۵/۰۶/۲۸',
    time: '۱۲:۵۴:۲۹',
    totalAmount: 500000000,
    status: 'completed',
    description: 'شارژ حساب (واریز) - تایید مدیر',
    afterWalletCash: 500000000,
  }
];

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    mobile: string;
    role: 'admin' | 'customer';
  } | null>(() => {
    const saved = localStorage.getItem('vateh_auth_user_v5');
    return saved ? JSON.parse(saved) : null;
  });

  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem('vateh_admin_password_v5');
    return saved || 'milad@68';
  });

  const [loginTab, setLoginTab] = useState<'customer' | 'admin'>('customer');
  const [loginMobile, setLoginMobile] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [adminLoginPass, setAdminLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password change modal states
  const [oldPassword, setOldPassword] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // App Core Data (Persisted to LocalStorage)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('vateh_customers_v5');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vateh_transactions_v5');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Default Buy and Sell reference rates (Image 3 Mapping)
  const [buyCopperPrice, setBuyCopperPrice] = useState<number>(() => {
    const saved = localStorage.getItem('vateh_buy_price_v5');
    return saved ? Number(saved) : 2150000; // default 2,150,000 Tomans
  });

  const [sellCopperPrice, setSellCopperPrice] = useState<number>(() => {
    const saved = localStorage.getItem('vateh_sell_price_v5');
    return saved ? Number(saved) : 2000000; // default 2,000,000 Tomans
  });

  // Company Central Warehouse Copper (Persistent)
  const [companyWarehouseCopper, setCompanyWarehouseCopper] = useState<number>(() => {
    const saved = localStorage.getItem('vateh_company_warehouse_copper_v5');
    return saved ? Number(saved) : 2000; // default 2000 kg (2 tons)
  });

  // Navigation states
  const [adminSelectedCustomerId, setAdminSelectedCustomerId] = useState<string>('');

  // UI modal states
  const [activeModal, setActiveModal] = useState<'buy' | 'sell' | 'check' | 'deposit' | 'withdraw' | 'add_customer' | 'receipt' | 'adjust_account' | 'company_stock' | 'market_price_settings' | 'change_password' | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilterType, setClientFilterType] = useState<'all' | 'copper' | 'cash'>('all');
  const [txSubFilter, setTxSubFilter] = useState<'all' | 'buy' | 'sell' | 'deposit' | 'withdraw'>('all');

  // Action states for the 5 forms
  // 1. Buy copper
  const [buyWeight, setBuyWeight] = useState('');
  const [buyRate, setBuyRate] = useState(buyCopperPrice);
  const [buyResponsible, setBuyResponsible] = useState('حسابدار مس');
  const [buyDesc, setBuyDesc] = useState('');

  // 2. Sell copper
  const [sellModel, setSellModel] = useState<'individual' | 'bourse'>('individual');
  const [sellSellerId, setSellSellerId] = useState<string>('');
  const [sellDestination, setSellDestination] = useState<'internal' | 'external'>('internal');
  const [externalBuyerName, setExternalBuyerName] = useState('');
  const [sellPaymentType, setSellPaymentType] = useState<'cash' | 'check'>('cash');
  const [sellCheckNumber, setSellCheckNumber] = useState('');
  const [sellCheckDueDate, setSellCheckDueDate] = useState('۱۴۰۳/۱۲/۲۸');
  const [sellCheckBank, setSellCheckBank] = useState('');
  const [sellDate, setSellDate] = useState('۱۴۰۵/۰۷/۱۱');
  const [sellResponsible, setSellResponsible] = useState('حسابدار مس');
  const [sellWeight, setSellWeight] = useState('');
  const [sellRate, setSellRate] = useState(sellCopperPrice); 
  const [sellPercentage, setSellPercentage] = useState<number | null>(null);
  const [sellDesc, setSellDesc] = useState('');

  // 3. Deposit
  const [depositCustomerId, setDepositCustomerId] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card' | 'bank' | 'pos' | 'cash'>('card');
  const [depositDate, setDepositDate] = useState('۱۴۰۵/۰۷/۱۱');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrackingNum, setDepositTrackingNum] = useState('');
  const [depositBank, setDepositBank] = useState('بانک ملت - حساب جاری شرکت مس و اته');
  const [depositResponsible, setDepositResponsible] = useState('حسابدار مالی / صندوقدار');
  const [depositDesc, setDepositDesc] = useState('');

  // 4. Withdraw
  const [withdrawCustomerId, setWithdrawCustomerId] = useState('');
  const [withdrawDate, setWithdrawDate] = useState('۱۴۰۵/۰۷/۱۱');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDesc, setWithdrawDesc] = useState('');

  // 5. Check register
  const [checkAmount, setCheckAmount] = useState('');
  const [checkNum, setCheckNum] = useState('');
  const [checkDesc, setCheckDesc] = useState('');

  // New Customer State
  const [newCustName, setNewCustName] = useState('');
  const [newCustMobile, setNewCustMobile] = useState('');

  // Company Stock Regulation State (Image 2 mapping)
  const [companyStockMode, setCompanyStockMode] = useState<'set' | 'charge'>('set');
  const [companyStockInput, setCompanyStockInput] = useState('2000');

  // Market Price Settings State (Image 3 Mapping)
  const [tempBuyPrice, setTempBuyPrice] = useState(buyCopperPrice);
  const [tempSellPrice, setTempSellPrice] = useState(sellCopperPrice);

  // 6. Adjust account/inventory (Image 1 replica)
  const [adjustCustomerId, setAdjustCustomerId] = useState('');
  const [adjustDate, setAdjustDate] = useState('۱۴۰۵/۰۷/۱۱');
  const [adjustCashMode, setAdjustCashMode] = useState<'increase' | 'decrease'>('increase');
  const [adjustCashAmount, setAdjustCashAmount] = useState('');
  const [adjustCopperMode, setAdjustCopperMode] = useState<'increase' | 'decrease'>('increase');
  const [adjustCopperAmount, setAdjustCopperAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // State for deleting customer confirmation
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);

  // Sync reference rates when they are modified
  useEffect(() => {
    setBuyRate(buyCopperPrice);
  }, [buyCopperPrice]);

  useEffect(() => {
    setSellRate(sellCopperPrice);
  }, [sellCopperPrice]);

  // Database Mapper Helpers
  const mapDbCustomer = (d: DbCustomer): Customer => ({
    id: d.id,
    name: d.name,
    mobile: d.mobile,
    password: d.password || '1234',
    walletCash: Number(d.wallet_cash) || 0,
    copperBalance: Number(d.copper_balance) || 0,
    sharePercentage: Number(d.share_percentage) || 0,
    realizedProfit: Number(d.realized_profit) || 0,
    profitChangePercent: Number(d.profit_change_percent) || 0,
    averageBuyPrice: Number(d.average_buy_price) || 0,
    inTransitChecks: Number(d.in_transit_checks) || 0,
    blockedCopper: Number(d.blocked_copper) || 0,
  });

  const mapCustomerToDb = (c: Customer): DbCustomer => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    password: c.password || '1234',
    wallet_cash: c.walletCash,
    copper_balance: c.copperBalance,
    share_percentage: c.sharePercentage,
    realized_profit: c.realizedProfit,
    profit_change_percent: c.profitChangePercent || 0,
    average_buy_price: c.averageBuyPrice || 0,
    in_transit_checks: c.inTransitChecks || 0,
    blocked_copper: c.blockedCopper || 0,
  });

  const mapDbTransaction = (t: DbTransaction): Transaction => ({
    id: t.id,
    customerId: t.customer_id,
    customerName: t.customer_name,
    type: t.type as any,
    date: t.date,
    time: t.time || '۰۹:۰۰:۰۰',
    amountKg: t.amount_kg !== null && t.amount_kg !== undefined ? Number(t.amount_kg) : undefined,
    ratePerKg: t.rate_per_kg !== null && t.rate_per_kg !== undefined ? Number(t.rate_per_kg) : undefined,
    totalAmount: Number(t.total_amount) || 0,
    status: (t.status as any) || 'completed',
    description: t.description || undefined,
    checkNumber: t.check_number || undefined,
    afterWalletCash: t.after_wallet_cash !== null && t.after_wallet_cash !== undefined ? Number(t.after_wallet_cash) : undefined,
    profitVal: t.profit_val !== null && t.profit_val !== undefined ? Number(t.profit_val) : undefined,
  });

  const mapTransactionToDb = (t: Transaction): DbTransaction => ({
    id: t.id,
    customer_id: t.customerId,
    customer_name: t.customerName,
    type: t.type,
    date: t.date,
    time: t.time,
    amount_kg: t.amountKg,
    rate_per_kg: t.ratePerKg,
    total_amount: t.totalAmount,
    status: t.status,
    description: t.description,
    check_number: t.checkNumber,
    after_wallet_cash: t.afterWalletCash,
    profit_val: t.profitVal,
  });

  // Initial Fetch and Realtime Subscription with Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchFromSupabase() {
      try {
        // 1. Fetch Customers
        const { data: custData, error: custErr } = await supabase.from('customers').select('*').order('created_at', { ascending: true });
        if (!custErr && custData && custData.length > 0 && isMounted) {
          setCustomers(custData.map(mapDbCustomer));
        } else if (!custErr && custData && custData.length === 0) {
          // Seed Supabase if empty
          const seedData = INITIAL_CUSTOMERS.map(mapCustomerToDb);
          await supabase.from('customers').insert(seedData);
        }

        // 2. Fetch Transactions
        const { data: txData, error: txErr } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (!txErr && txData && txData.length > 0 && isMounted) {
          setTransactions(txData.map(mapDbTransaction));
        } else if (!txErr && txData && txData.length === 0) {
          const seedTx = INITIAL_TRANSACTIONS.map(mapTransactionToDb);
          await supabase.from('transactions').insert(seedTx);
        }

        // 3. Fetch Company Settings
        const { data: settingsData, error: settingsErr } = await supabase.from('company_settings').select('*').eq('id', 1).single();
        if (!settingsErr && settingsData && isMounted) {
          if (settingsData.admin_password) setAdminPassword(settingsData.admin_password);
          if (settingsData.company_warehouse_copper !== undefined) setCompanyWarehouseCopper(Number(settingsData.company_warehouse_copper));
          if (settingsData.buy_copper_price !== undefined) setBuyCopperPrice(Number(settingsData.buy_copper_price));
          if (settingsData.sell_copper_price !== undefined) setSellCopperPrice(Number(settingsData.sell_copper_price));
        }
      } catch (err) {
        console.log('Supabase sync notice:', err);
      }
    }

    fetchFromSupabase();

    // Supabase Realtime Channel
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updated = mapDbCustomer(payload.new as DbCustomer);
          setCustomers(prev => {
            const idx = prev.findIndex(c => c.id === updated.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = updated;
              return copy;
            }
            return [...prev, updated];
          });
        } else if (payload.eventType === 'DELETE') {
          setCustomers(prev => prev.filter(c => c.id !== (payload.old as any).id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTx = mapDbTransaction(payload.new as DbTransaction);
          setTransactions(prev => [newTx, ...prev.filter(t => t.id !== newTx.id)]);
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'company_settings' }, (payload) => {
        if (payload.new) {
          const s = payload.new as DbCompanySettings;
          if (s.admin_password) setAdminPassword(s.admin_password);
          if (s.company_warehouse_copper !== undefined) setCompanyWarehouseCopper(Number(s.company_warehouse_copper));
          if (s.buy_copper_price !== undefined) setBuyCopperPrice(Number(s.buy_copper_price));
          if (s.sell_copper_price !== undefined) setSellCopperPrice(Number(s.sell_copper_price));
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync customers to Supabase
  const isInitialCustomerSync = useRef(true);
  useEffect(() => {
    localStorage.setItem('vateh_customers_v5', JSON.stringify(customers));
    if (isInitialCustomerSync.current) {
      isInitialCustomerSync.current = false;
      return;
    }
    const dbPayload = customers.map(mapCustomerToDb);
    supabase.from('customers').upsert(dbPayload).then();
  }, [customers]);

  // Sync transactions to Supabase
  const isInitialTxSync = useRef(true);
  useEffect(() => {
    localStorage.setItem('vateh_transactions_v5', JSON.stringify(transactions));
    if (isInitialTxSync.current) {
      isInitialTxSync.current = false;
      return;
    }
    if (transactions.length > 0) {
      const dbPayload = transactions.map(mapTransactionToDb);
      supabase.from('transactions').upsert(dbPayload).then();
    }
  }, [transactions]);

  // Sync settings to Supabase
  useEffect(() => {
    localStorage.setItem('vateh_buy_price_v5', buyCopperPrice.toString());
    localStorage.setItem('vateh_sell_price_v5', sellCopperPrice.toString());
    localStorage.setItem('vateh_company_warehouse_copper_v5', companyWarehouseCopper.toString());
    localStorage.setItem('vateh_admin_password_v5', adminPassword);

    supabase.from('company_settings').upsert({
      id: 1,
      admin_password: adminPassword,
      company_warehouse_copper: companyWarehouseCopper,
      buy_copper_price: buyCopperPrice,
      sell_copper_price: sellCopperPrice,
      updated_at: new Date().toISOString()
    }).then();
  }, [buyCopperPrice, sellCopperPrice, companyWarehouseCopper, adminPassword]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('vateh_auth_user_v5', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('vateh_auth_user_v5');
    }
  }, [currentUser]);

  // Persian digit convertor for inputs
  const toEnglishDigits = (str: string) => {
    return str.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
              .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  };

  // Human-readable Persian formats
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fa-IR').format(Math.round(num));
  };

  const formatKg = (num: number) => {
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
  };

  // Translation to words helper (Image 3 replica)
  const numToPersianWords = (num: number): string => {
    if (!num || isNaN(num)) return "صفر تومان";
    const millions = Math.floor(num / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    let res = "";
    if (millions > 0) {
      res += `${millions} میلیون`;
    }
    if (thousands > 0) {
      if (res) res += " و ";
      res += `${thousands} هزار`;
    }
    if (res) res += " تومان";
    else res = `${num} تومان`;
    return `معادل ${res}`;
  };

  // Customer Login action
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const mob = toEnglishDigits(loginMobile.trim());
    const pass = toEnglishDigits(loginPassword.trim());

    if (!mob || !pass) {
      setLoginError('لطفاً شماره موبایل و رمز عبور را وارد کنید.');
      return;
    }

    const client = customers.find(c => toEnglishDigits(c.mobile) === mob);
    const expectedPass = client?.password || '1234';

    if (client && pass === expectedPass) {
      setCurrentUser({
        id: client.id,
        name: client.name,
        mobile: client.mobile,
        role: 'customer'
      });
      setLoginError('');
    } else {
      setLoginError('شماره همراه یا رمز عبور اشتباه است.');
    }
  };

  // Admin Login action
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const pass = adminLoginPass.trim();
    if (!pass) {
      setLoginError('لطفاً رمز عبور مدیر سیستم را وارد کنید.');
      return;
    }

    if (pass === adminPassword) {
      setCurrentUser({
        id: 'admin',
        name: 'مدیرعامل واحد بازرگانی',
        mobile: '09120000000',
        role: 'admin'
      });
      setLoginError('');
    } else {
      setLoginError('رمز عبور مدیریت اشتباه است.');
    }
  };

  // Change Password action
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!oldPassword.trim()) {
      setPasswordError('لطفاً رمز عبور فعلی را وارد کنید.');
      return;
    }

    if (!newPasswordInput.trim() || newPasswordInput.length < 4) {
      setPasswordError('رمز عبور جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('تکرار رمز عبور جدید با رمز عبور وارد شده مطابقت ندارد.');
      return;
    }

    if (currentUser?.role === 'admin') {
      if (oldPassword !== adminPassword) {
        setPasswordError('رمز عبور فعلی مدیریت اشتباه است.');
        return;
      }
      setAdminPassword(newPasswordInput);
      setPasswordSuccess('رمز عبور مدیریت با موفقیت تغییر یافت.');
      setTimeout(() => {
        setActiveModal(null);
        setPasswordSuccess('');
      }, 1500);
    } else if (currentUser?.role === 'customer') {
      const client = customers.find(c => c.id === currentUser.id);
      const currentExpected = client?.password || '1234';

      if (oldPassword !== currentExpected) {
        setPasswordError('رمز عبور فعلی حساب کاربری شما اشتباه است.');
        return;
      }

      setCustomers(customers.map(c => {
        if (c.id === currentUser.id) {
          return { ...c, password: newPasswordInput };
        }
        return c;
      }));

      setPasswordSuccess('رمز عبور پنل کاربری شما با موفقیت تغییر یافت.');
      setTimeout(() => {
        setActiveModal(null);
        setPasswordSuccess('');
      }, 1500);
    }
  };

  // Launch modal
  const openActionModal = (type: 'buy' | 'sell' | 'check' | 'deposit' | 'withdraw') => {
    if (type === 'buy') {
      setBuyWeight('');
      setBuyRate(buyCopperPrice);
      setBuyResponsible('حسابدار مس');
      setBuyDesc('خرید لوله مسی - فروشنده: انبار شرکت مس و اته');
    } else if (type === 'sell') {
      setSellModel('individual');
      setSellSellerId(adminSelectedCustomerId || customers[0]?.id || '');
      setSellDestination('internal');
      setExternalBuyerName('');
      setSellPaymentType('cash');
      setSellCheckNumber('');
      setSellCheckDueDate('۱۴۰۳/۱۲/۲۸');
      setSellCheckBank('');
      setSellDate('۱۴۰۵/۰۷/۱۱');
      setSellResponsible('حسابدار مس');
      setSellWeight('');
      setSellPercentage(null);
      setSellRate(sellCopperPrice);
      setSellDesc('');
    } else if (type === 'deposit') {
      setDepositCustomerId(adminSelectedCustomerId || customers[0]?.id || '');
      setDepositMethod('card');
      setDepositDate('۱۴۰۵/۰۷/۱۱');
      setDepositAmount('');
      setDepositTrackingNum('');
      setDepositBank('بانک ملت - حساب جاری شرکت مس و اته');
      setDepositResponsible('حسابدار مالی / صندوقدار');
      setDepositDesc('');
    } else if (type === 'withdraw') {
      setWithdrawCustomerId(adminSelectedCustomerId || customers[0]?.id || '');
      setWithdrawDate('۱۴۰۵/۰۷/۱۱');
      setWithdrawAmount('');
      setWithdrawDesc('');
    } else if (type === 'check') {
      setCheckAmount('');
      setCheckNum('');
      setCheckDesc('ثبت چک صیادی مسدود لوله مسی');
    }
    setActiveModal(type);
  };

  // BUY copper transaction
  const submitBuyCopper = (e: React.FormEvent) => {
    e.preventDefault();
    const client = customers.find(c => c.id === adminSelectedCustomerId);
    if (!client) return;

    const kg = parseFloat(toEnglishDigits(buyWeight));
    if (isNaN(kg) || kg <= 0) {
      alert('لطفاً مقدار معتبر وارد کنید.');
      return;
    }

    const totalCost = kg * buyRate;
    if (client.walletCash < totalCost) {
      alert(`موجودی ریالی حساب کافی نیست. هزینه کل: ${formatNumber(totalCost)} تومان | موجودی مشتری: ${formatNumber(client.walletCash)} تومان`);
      return;
    }

    if (companyWarehouseCopper < kg) {
      alert(`موجودی انبار مرکزی شرکت (${formatKg(companyWarehouseCopper)} ک‌گ) کافی نیست! ابتدا انبار را شارژ کنید.`);
      return;
    }

    const updatedCustomers = customers.map(c => {
      if (c.id === client.id) {
        const newWeight = c.copperBalance + kg;
        const totalOldCost = c.copperBalance * c.averageBuyPrice;
        const totalNewCost = kg * buyRate;
        const newAvg = (totalOldCost + totalNewCost) / newWeight;
        return {
          ...c,
          walletCash: c.walletCash - totalCost,
          copperBalance: newWeight,
          averageBuyPrice: isNaN(newAvg) ? buyRate : newAvg
        };
      }
      return c;
    });

    const totalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
    const finalized = updatedCustomers.map(c => ({
      ...c,
      sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
    }));

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'buy',
      date: new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date()),
      time: new Date().toLocaleTimeString('fa-IR'),
      amountKg: kg,
      ratePerKg: buyRate,
      totalAmount: totalCost,
      status: 'completed',
      description: `${buyDesc || 'خرید لوله مسی فیزیکی از شرکت'}${buyResponsible ? ` | مسئول ثبت: ${buyResponsible}` : ''}`,
      afterWalletCash: client.walletCash - totalCost
    };

    setCompanyWarehouseCopper(prev => prev - kg);
    setCustomers(finalized);
    setTransactions([newTx, ...transactions]);
    setActiveModal(null);
  };

  // SELL copper transaction
  const submitSellCopper = (e: React.FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(toEnglishDigits(sellWeight));
    if (isNaN(kg) || kg <= 0) {
      alert('لطفاً مقدار معتبر وارد کنید.');
      return;
    }

    const txDate = sellDate || new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date());
    const txTime = new Date().toLocaleTimeString('fa-IR');

    if (sellModel === 'individual') {
      const selectedId = sellSellerId || adminSelectedCustomerId;
      const client = customers.find(c => c.id === selectedId);
      if (!client) {
        alert('لطفاً طرف حساب فروشنده را انتخاب کنید.');
        return;
      }

      if (client.copperBalance < kg) {
        alert(`موجودی لوله مسی مشتری کافی نیست. موجودی: ${formatKg(client.copperBalance)} کیلوگرم`);
        return;
      }

      const totalRevenue = kg * sellRate;
      const profit = (sellRate - client.averageBuyPrice) * kg;

      const updatedCustomers = customers.map(c => {
        if (c.id === client.id) {
          const newWallet = sellPaymentType === 'cash' ? c.walletCash + totalRevenue : c.walletCash;
          const newChecks = sellPaymentType === 'check' ? c.inTransitChecks + totalRevenue : c.inTransitChecks;
          const newBlocked = sellPaymentType === 'check' ? c.blockedCopper + 1 : c.blockedCopper;

          return {
            ...c,
            walletCash: newWallet,
            inTransitChecks: newChecks,
            blockedCopper: newBlocked,
            copperBalance: Math.max(0, c.copperBalance - kg),
            realizedProfit: c.realizedProfit + (profit > 0 ? profit : 0)
          };
        }
        return c;
      });

      const totalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
      const finalized = updatedCustomers.map(c => ({
        ...c,
        sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
      }));

      // Detailed transaction description matching options
      let desc = sellDestination === 'internal' 
        ? 'فروش داخلی (تحویل به شرکت مس و اته)' 
        : `فروش به خارج (خریدار بیرونی: ${externalBuyerName.trim() || 'نامشخص'})`;
      
      if (sellPaymentType === 'check') {
        desc += ` | دریافت چک صیاد: ${sellCheckNumber || 'بدون سریال'} (سررسید: ${sellCheckDueDate})${sellCheckBank ? ` - بانک ${sellCheckBank}` : ''}`;
      } else {
        desc += ' | تسویه نقدی کیف پول';
      }

      if (sellResponsible) {
        desc += ` | ثبت‌کننده: ${sellResponsible}`;
      }

      if (sellDesc) {
        desc += ` | شرح: ${sellDesc}`;
      }

      const newTx: Transaction = {
        id: 'tx_' + Date.now(),
        customerId: client.id,
        customerName: client.name,
        type: 'sell',
        date: txDate,
        time: txTime,
        amountKg: kg,
        ratePerKg: sellRate,
        totalAmount: totalRevenue,
        status: 'completed',
        description: desc,
        checkNumber: sellPaymentType === 'check' ? sellCheckNumber : undefined,
        afterWalletCash: sellPaymentType === 'cash' ? client.walletCash + totalRevenue : client.walletCash,
        profitVal: profit > 0 ? profit : undefined
      };

      if (sellDestination === 'internal') {
        setCompanyWarehouseCopper(prev => prev + kg);
      }

      setCustomers(finalized);
      setTransactions([newTx, ...transactions]);
      setActiveModal(null);
    } else {
      // Bourse / Proportionate sell across all shareholders
      if (totalCopperPool < kg) {
        alert(`مجموع مس انبار شرکت (${formatKg(totalCopperPool)} کیلوگرم) کمتر از مقدار درخواستی فروش است.`);
        return;
      }

      const totalRevenue = kg * sellRate;
      const newTxs: Transaction[] = [];

      const updatedCustomers = customers.map(c => {
        if (c.copperBalance <= 0 || totalCopperPool <= 0) return c;
        const proportion = c.copperBalance / totalCopperPool;
        const custKg = kg * proportion;
        const custRev = totalRevenue * proportion;
        const profit = (sellRate - c.averageBuyPrice) * custKg;

        const newWallet = sellPaymentType === 'cash' ? c.walletCash + custRev : c.walletCash;
        const newChecks = sellPaymentType === 'check' ? c.inTransitChecks + custRev : c.inTransitChecks;
        const newBlocked = sellPaymentType === 'check' ? c.blockedCopper + 1 : c.blockedCopper;

        let desc = `فروش بورسی (سهم متناسب ${c.sharePercentage.toFixed(1)}٪)`;
        desc += sellDestination === 'internal' 
          ? ' - تحویل به شرکت' 
          : ` - خریدار بیرونی: ${externalBuyerName.trim() || 'نامشخص'}`;
        if (sellResponsible) desc += ` | مسئول: ${sellResponsible}`;
        if (sellDesc) desc += ` | ${sellDesc}`;

        newTxs.push({
          id: 'tx_' + Date.now() + '_' + c.id,
          customerId: c.id,
          customerName: c.name,
          type: 'sell',
          date: txDate,
          time: txTime,
          amountKg: custKg,
          ratePerKg: sellRate,
          totalAmount: custRev,
          status: 'completed',
          description: desc,
          afterWalletCash: newWallet,
          profitVal: profit > 0 ? profit : undefined
        });

        return {
          ...c,
          walletCash: newWallet,
          inTransitChecks: newChecks,
          blockedCopper: newBlocked,
          copperBalance: Math.max(0, c.copperBalance - custKg),
          realizedProfit: c.realizedProfit + (profit > 0 ? profit : 0)
        };
      });

      const newTotalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
      const finalized = updatedCustomers.map(c => ({
        ...c,
        sharePercentage: newTotalCopper > 0 ? (c.copperBalance / newTotalCopper) * 100 : 0
      }));

      if (sellDestination === 'internal') {
        setCompanyWarehouseCopper(prev => prev + kg);
      }

      setCustomers(finalized);
      setTransactions([...newTxs, ...transactions]);
      setActiveModal(null);
    }
  };

  // DEPOSIT transaction
  const submitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = depositCustomerId || adminSelectedCustomerId;
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    const amount = parseFloat(toEnglishDigits(depositAmount.replace(/,/g, '')));
    if (isNaN(amount) || amount <= 0) {
      alert('لطفاً مبلغ معتبر وارد کنید.');
      return;
    }

    const methodName = 
      depositMethod === 'card' ? 'کارت به کارت / ساتنا و پایا' :
      depositMethod === 'bank' ? 'واریز مستقیم به حساب جاری شرکت' :
      depositMethod === 'pos' ? 'کارتخوان (POS) دفتر شرکت' : 'نقدی (صندوق مرکزی شرکت)';

    let desc = `واریز ریالی (${methodName})`;
    if (depositTrackingNum.trim()) {
      desc += ` | شماره پیگیری/فیش: ${depositTrackingNum.trim()}`;
    }
    if (depositBank && depositMethod !== 'cash') {
      desc += ` | حساب مقصد: ${depositBank}`;
    }
    if (depositResponsible) {
      desc += ` | مسئول ثبت: ${depositResponsible}`;
    }
    if (depositDesc.trim()) {
      desc += ` | شرح: ${depositDesc.trim()}`;
    }

    setCustomers(customers.map(c => {
      if (c.id === client.id) {
        return { ...c, walletCash: c.walletCash + amount };
      }
      return c;
    }));

    const txDate = depositDate || new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date());

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'deposit',
      date: txDate,
      time: new Date().toLocaleTimeString('fa-IR'),
      totalAmount: amount,
      status: 'completed',
      description: desc,
      afterWalletCash: client.walletCash + amount
    };

    setTransactions([newTx, ...transactions]);
    setActiveModal(null);
  };

  // WITHDRAW transaction
  const submitWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = withdrawCustomerId || adminSelectedCustomerId;
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    const amount = parseFloat(toEnglishDigits(withdrawAmount.replace(/,/g, '')));
    if (isNaN(amount) || amount <= 0) {
      alert('لطفاً مبلغ معتبر وارد کنید.');
      return;
    }

    if (client.walletCash < amount) {
      alert('موجودی کیف پول ریالی شخص برای این مبلغ برداشت کافی نیست.');
      return;
    }

    setCustomers(customers.map(c => {
      if (c.id === client.id) {
        return { ...c, walletCash: c.walletCash - amount };
      }
      return c;
    }));

    const txDate = withdrawDate || new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date());

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'withdraw',
      date: txDate,
      time: new Date().toLocaleTimeString('fa-IR'),
      totalAmount: amount,
      status: 'completed',
      description: withdrawDesc.trim() || 'برداشت وجه از کیف پول و تسویه حساب ریالی',
      afterWalletCash: client.walletCash - amount
    };

    setTransactions([newTx, ...transactions]);
    setActiveModal(null);
  };

  // REGISTER CHECK transaction
  const submitRegisterCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const client = customers.find(c => c.id === adminSelectedCustomerId);
    if (!client) return;

    const amountVal = parseFloat(toEnglishDigits(checkAmount));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('لطفاً مبلغ معتبر برای چک صیادی وارد کنید.');
      return;
    }

    setCustomers(customers.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          inTransitChecks: c.inTransitChecks + amountVal,
          blockedCopper: c.blockedCopper + 1
        };
      }
      return c;
    }));

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'check_register',
      date: new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date()),
      time: new Date().toLocaleTimeString('fa-IR'),
      totalAmount: amountVal,
      status: 'completed',
      description: checkDesc || 'سند اسناد درراه - ۱ چک مسدود لوله مسی',
      checkNumber: checkNum || 'ثبت نشده',
      afterWalletCash: client.walletCash
    };

    setTransactions([newTx, ...transactions]);
    setActiveModal(null);
  };

  // Helper for applying sell percentage
  const applySellPercentage = (pct: number, maxWeight: number) => {
    setSellPercentage(pct);
    const calculated = (maxWeight * pct) / 100;
    setSellWeight(calculated.toFixed(2));
  };

  // Regulation of Warehouse (Image 2)
  const submitCompanyStockRegulation = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedVal = parseFloat(toEnglishDigits(companyStockInput));
    if (isNaN(parsedVal) || parsedVal < 0) {
      alert('لطفاً مقدار عددی معتبری وارد نمایید.');
      return;
    }

    if (companyStockMode === 'set') {
      setCompanyWarehouseCopper(parsedVal);
    } else {
      setCompanyWarehouseCopper(prev => prev + parsedVal);
    }

    setActiveModal(null);
  };

  // Submit Adjustment (Image 1 mapping)
  const submitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = adjustCustomerId || adminSelectedCustomerId;
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    // Convert Persian/Arabic/local digits to English
    const cleanCash = toEnglishDigits(adjustCashAmount).replace(/,/g, '');
    const cleanCopper = toEnglishDigits(adjustCopperAmount);

    const rawCash = parseFloat(cleanCash) || 0;
    const rawCopper = parseFloat(cleanCopper) || 0;

    const cashAdjustVal = adjustCashMode === 'increase' ? rawCash : -rawCash;
    const copperAdjustVal = adjustCopperMode === 'increase' ? rawCopper : -rawCopper;

    if (rawCash === 0 && rawCopper === 0) {
      alert('لطفاً حداقل یکی از مقادیر تعدیل ریالی یا وزنی را وارد نمایید.');
      return;
    }

    if (!adjustReason.trim()) {
      alert('لطفاً علت اصلاح حساب را به عنوان شرح بنویسید.');
      return;
    }

    const updatedCustomers = customers.map(c => {
      if (c.id === client.id) {
        const newCopperBalance = Math.max(0, c.copperBalance + copperAdjustVal);
        return {
          ...c,
          walletCash: Math.max(0, c.walletCash + cashAdjustVal),
          copperBalance: newCopperBalance,
        };
      }
      return c;
    });

    const totalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
    const finalized = updatedCustomers.map(c => ({
      ...c,
      sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
    }));

    const txDate = adjustDate || new Intl.DateTimeFormat('fa-IR-u-nu-latn').format(new Date());

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'adjustment',
      date: txDate,
      time: new Date().toLocaleTimeString('fa-IR'),
      amountKg: copperAdjustVal !== 0 ? copperAdjustVal : undefined,
      totalAmount: cashAdjustVal,
      status: 'completed',
      description: `سند اصلاح حساب و تعدیل موجودی - ${adjustReason.trim()}`,
      afterWalletCash: Math.max(0, client.walletCash + cashAdjustVal)
    };

    setCustomers(finalized);
    setTransactions([newTx, ...transactions]);

    setAdjustCashAmount('');
    setAdjustCopperAmount('');
    setAdjustReason('');
    setActiveModal(null);
  };

  // Delete customer profile
  const deleteCustomer = (id: string, name: string) => {
    if (confirm(`آیا از حذف حساب کاربری «${name}» اطمینان دارید؟`)) {
      setCustomers(customers.filter(c => c.id !== id));
      setTransactions(transactions.filter(t => t.customerId !== id));
    }
  };

  // Save reference rates (Image 3 implementation)
  const saveMarketPriceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setBuyCopperPrice(tempBuyPrice);
    setSellCopperPrice(tempSellPrice);
    setActiveModal(null);
  };

  // Add customer
  const submitNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustMobile.trim()) {
      alert('لطفاً نام و شماره تلفن همراه را وارد کنید.');
      return;
    }

    const cleanMob = toEnglishDigits(newCustMobile.trim());
    if (customers.some(c => c.mobile === cleanMob)) {
      alert('این شماره تلفن قبلاً در سامانه ثبت شده است.');
      return;
    }

    const newCust: Customer = {
      id: 'c_' + Date.now(),
      name: newCustName.trim(),
      mobile: cleanMob,
      walletCash: 0,
      copperBalance: 0,
      sharePercentage: 0,
      realizedProfit: 0,
      profitChangePercent: 0,
      averageBuyPrice: 0,
      inTransitChecks: 0,
      blockedCopper: 0
    };

    setCustomers([...customers, newCust]);
    setNewCustName('');
    setNewCustMobile('');
    setActiveModal(null);
  };

  // Stats
  const totalCopperPool = customers.reduce((acc, c) => acc + c.copperBalance, 0);
  const totalCashPool = customers.reduce((acc, c) => acc + c.walletCash, 0);
  const totalAssetsVal = totalCashPool + (totalCopperPool * buyCopperPrice);
  const totalProfitPool = customers.reduce((acc, c) => acc + c.realizedProfit, 0);

  // Search filter
  const filteredCustomers = customers.filter(c => {
    const matchesQuery = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.mobile.includes(searchQuery);
    if (clientFilterType === 'all') return matchesQuery;
    if (clientFilterType === 'copper') return matchesQuery && c.copperBalance > 0;
    if (clientFilterType === 'cash') return matchesQuery && c.walletCash > 0;
    return matchesQuery;
  });

  // Safe navigation variables for logged-in customer view
  const isCustomer = currentUser?.role === 'customer';
  const myCustomerId = isCustomer ? currentUser?.id : adminSelectedCustomerId;
  const activeProfile = customers.find(c => c.id === myCustomerId);
  
  const myTotalAssets = activeProfile ? activeProfile.walletCash + (activeProfile.copperBalance * buyCopperPrice) : 0;
  
  // Filtered transactions for the active client
  const myTransactions = transactions.filter(t => t.customerId === myCustomerId).filter(t => {
    if (txSubFilter === 'all') return true;
    return t.type === txSubFilter;
  });

  // Render Login state if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden" dir="rtl">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-900/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-500 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-amber-600/20 border border-amber-400/30">
              و
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black text-white tracking-tight">واته</h1>
              <p className="text-xs text-amber-300/80 font-bold">سامانه جامع معاملات لوله مسی و کاتد</p>
            </div>
          </div>
          <h2 className="mt-2 text-center text-base font-extrabold text-slate-200">
            ورود به درگاه هوشمند معاملات
          </h2>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
          <div className="bg-slate-900/90 backdrop-blur-xl py-7 px-6 shadow-2xl rounded-3xl border border-slate-800 space-y-5">
            
            {/* Login Mode Switcher Tabs */}
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('customer');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginTab === 'customer'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>ورود مشتریان</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('admin');
                  setLoginError('');
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  loginTab === 'admin'
                    ? 'bg-slate-800 text-amber-400 shadow-md border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>ورود مدیریت</span>
              </button>
            </div>

            {/* Form: Customer Login */}
            {loginTab === 'customer' && (
              <form className="space-y-4" onSubmit={handleCustomerLogin}>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 mr-1">
                    شماره تلفن همراه
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginMobile}
                      onChange={(e) => setLoginMobile(e.target.value)}
                      placeholder="09xxxxxxxxx"
                      className="block w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 mr-1">
                    رمز عبور
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right font-mono text-sm"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                  >
                    ورود به پنل حساب مشتری
                  </button>
                </div>
              </form>
            )}

            {/* Form: Admin Login */}
            {loginTab === 'admin' && (
              <form className="space-y-4" onSubmit={handleAdminLogin}>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 mr-1">
                    رمز عبور مدیریت سیستم <span className="text-red-400">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-amber-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={adminLoginPass}
                      onChange={(e) => setAdminLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pr-10 pl-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right font-mono text-sm"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-lg text-xs font-black text-white bg-slate-800 hover:bg-slate-700 border border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
                  >
                    ورود به پنل مدیریت کل
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    );
  }

  // Active Admin Screen View Selector
  const showRoster = currentUser.role === 'admin' && adminSelectedCustomerId === '';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-amber-100 text-slate-900" dir="rtl">
      
      {/* HEADER BAR */}
      <header className="sticky top-0 bg-white border-b border-slate-200 z-30 shadow-sm px-3 md:px-6 py-2 flex items-center justify-between gap-2 md:gap-4">
        {/* Vateh Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
            و
          </div>
          <span className="text-xs md:text-sm font-black text-slate-900">واته</span>
        </div>

        {/* Small Responsive Copper Price Button */}
        <button
          onClick={() => {
            if (currentUser.role === 'admin') {
              setTempBuyPrice(buyCopperPrice);
              setTempSellPrice(sellCopperPrice);
              setActiveModal('market_price_settings');
            }
          }}
          className="flex items-center gap-1 md:gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg px-2 py-1 text-[10px] md:text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
        >
          <Coins className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">نرخ لوله مسی:</span>
          <span className="inline sm:hidden">نرخ:</span>
          <span className="font-mono bg-white px-1 py-0.5 rounded text-slate-900 border border-slate-100 font-extrabold">
            {formatNumber(buyCopperPrice)} ت
          </span>
          {currentUser.role === 'admin' && (
            <span className="text-[8px] bg-amber-600 text-white px-1 py-0.2 rounded font-black shrink-0">تنظیم</span>
          )}
        </button>

        {/* User Profile Info, Change Password Lock Button & Logout */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-right bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
            <div className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-[10px] shadow-sm shrink-0">
              {currentUser.name[0]}
            </div>
            <div className="block text-[8px] md:text-[10px] leading-none text-right">
              <span className="block font-extrabold text-slate-900 leading-none">
                {currentUser.name}
              </span>
              <span className="block text-[7px] md:text-[8px] text-slate-400 leading-none font-mono mt-0.5">
                {currentUser.role === 'admin' ? 'مدیر عامل' : 'مشتری'}
              </span>
            </div>
          </div>

          {/* Change Password Lock Button (Requested by User) */}
          <button
            type="button"
            onClick={() => {
              setOldPassword('');
              setNewPasswordInput('');
              setConfirmPasswordInput('');
              setPasswordError('');
              setPasswordSuccess('');
              setActiveModal('change_password');
            }}
            title="تغییر رمز عبور حساب کاربری"
            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-xl border border-slate-200 transition bg-white flex items-center gap-1 cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline text-[10px] font-bold text-slate-700">تغییر رمز</span>
          </button>

          <button
            onClick={() => {
              setCurrentUser(null);
              setAdminSelectedCustomerId('');
            }}
            title="خروج از حساب"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-slate-200 transition bg-white cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 lg:p-6 space-y-4">

        {/* =========================================
            ADMIN ROSTER PAGE (IMAGE 2 REPLICA)
            ========================================= */}
        {showRoster && (
          <div className="space-y-4">
            
            {/* 1. Orange Central Stock Banner */}
            <div className="bg-amber-600 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow shadow-amber-950/20">
              <div className="flex items-center gap-3 text-right">
                <Database className="w-5 h-5 shrink-0" />
                <div className="space-y-0.5">
                  <h3 className="text-xs lg:text-sm font-extrabold">
                    موجودی لوله مسی انبار شرکت در حال حاضر «{formatKg(companyWarehouseCopper)} کیلوگرم» است!
                  </h3>
                  <p className="text-[10px] text-amber-100">
                    جهت ثبت موجودی اولیه یا شارژ لوله مسی آماده تحویل در انبار مرکزی، دکمه روبرو را بزنید.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setCompanyStockInput(companyWarehouseCopper.toString());
                  setCompanyStockMode('set');
                  setActiveModal('company_stock');
                }}
                className="shrink-0 bg-slate-950 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 hover:bg-slate-900 transition"
              >
                <span>+ وارد کردن موجودی لوله مسی انبار</span>
              </button>
            </div>

            {/* 2. Total Market Stats Row (Strict Image 2 Design Match with Loleh Mesi terms) */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">کل موجودی ریالی</span>
                <span className="text-sm font-extrabold text-slate-950 font-mono block">
                  {formatNumber(totalCashPool)}
                </span>
                <span className="text-[9px] text-slate-400 block">مانده نقدی کل کیف پول‌ها</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">مجموع لوله مسی مشتریان</span>
                <span className="text-sm font-extrabold text-slate-950 font-mono block">
                  {formatKg(totalCopperPool)} ک‌گ
                </span>
                <span className="text-[9px] text-slate-400 block">مجموع دارایی لوله مسی مشتریان</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">ارزش روز لوله مسی</span>
                <span className="text-sm font-extrabold text-slate-950 font-mono block">
                  {formatNumber(totalCopperPool * buyCopperPrice)}
                </span>
                <span className="text-[9px] text-slate-400 block">با نرخ خرید {formatNumber(buyCopperPrice)} ت</span>
              </div>

              <div className="bg-slate-900 text-white p-3.5 rounded-xl text-right space-y-1">
                <span className="text-[10px] text-slate-400 block">مجموع کل دارایی‌ها</span>
                <span className="text-sm font-extrabold text-amber-400 font-mono block">
                  {formatNumber(totalAssetsVal)}
                </span>
                <span className="text-[9px] text-slate-400 block">نقدینگی + ارزش لوله مسی انبار</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">مجموع سود معاملات</span>
                <span className="text-sm font-extrabold text-emerald-600 font-mono block">
                  +{formatNumber(totalProfitPool)}+ تومان
                </span>
                <span className="text-[9px] text-emerald-500 block">۱۵.۹٪ بازدهی کل</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">تعداد طرف‌های حساب</span>
                <span className="text-sm font-extrabold text-slate-950 block">
                  {customers.length} نفر
                </span>
                <span className="text-[9px] text-slate-400 block">خرید کل: ۱,۳۷۴ ک‌گ</span>
              </div>

            </div>

            {/* 3. Customers Table with Roster Design (Strict Image 2 Design Match with Loleh Mesi terms) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-950 text-sm">دفتر حساب و کیف پول لوله مسی افراد</h3>
                  <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold">{customers.length} نفر</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="جستجوی نام، تلفن..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none w-56 font-sans text-xs"
                    />
                  </div>

                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-black border">
                    <button
                      onClick={() => setClientFilterType('all')}
                      className={`px-3 py-1.5 rounded-md transition-all ${clientFilterType === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      همه
                    </button>
                    <button
                      onClick={() => setClientFilterType('copper')}
                      className={`px-3 py-1.5 rounded-md transition-all ${clientFilterType === 'copper' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      دارای مس (۳)
                    </button>
                    <button
                      onClick={() => setClientFilterType('cash')}
                      className={`px-3 py-1.5 rounded-md transition-all ${clientFilterType === 'cash' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      دارای ریال (۲)
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveModal('add_customer')}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                  >
                    <span>افزودن حساب کاربری</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                      <th className="py-3.5 px-5 font-semibold">نام شخص</th>
                      <th className="py-3.5 px-4 font-semibold text-center">درصد سهم (بورس)</th>
                      <th className="py-3.5 px-4 font-semibold">موجودی ریالی (تومان)</th>
                      <th className="py-3.5 px-4 font-semibold">موجودی لوله مسی (کیلوگرم)</th>
                      <th className="py-3.5 px-4 font-semibold">ارزش روز لوله مسی (تومان)</th>
                      <th className="py-3.5 px-4 font-semibold">مجموع دارایی (تومان)</th>
                      <th className="py-3.5 px-4 font-semibold">سود واقعی</th>
                      <th className="py-3.5 px-5 font-semibold text-left">عملیات کیف پول و معاملات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map(cust => {
                      const copValue = cust.copperBalance * buyCopperPrice;
                      const totAsset = cust.walletCash + copValue;

                      return (
                        <tr 
                          key={cust.id} 
                          onClick={() => setAdminSelectedCustomerId(cust.id)}
                          className="hover:bg-slate-50 transition cursor-pointer"
                        >
                          
                          <td className="py-4 px-5">
                            <span className="font-extrabold text-slate-950 block">{cust.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{cust.mobile}</span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200/50 rounded-lg text-amber-800 font-black font-mono">
                              <span>{cust.sharePercentage.toFixed(1)}٪</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-bold font-mono text-slate-900">
                            {formatNumber(cust.walletCash)}
                          </td>

                          <td className="py-4 px-4 font-bold font-mono text-slate-900">
                            {formatKg(cust.copperBalance)}
                          </td>

                          <td className="py-4 px-4 font-bold font-mono text-slate-500">
                            {formatNumber(copValue)}
                          </td>

                          <td className="py-4 px-4 font-black font-mono text-amber-800">
                            {formatNumber(totAsset)}
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex flex-col items-start font-bold">
                              <span className="text-emerald-600 font-mono">
                                {cust.realizedProfit > 0 ? '+' : ''}{formatNumber(cust.realizedProfit)}
                              </span>
                              {cust.profitChangePercent > 0 && (
                                <span className="text-[10px] text-emerald-500 mt-0.5">
                                  {cust.profitChangePercent}%+
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-4 px-5 text-left">
                            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setAdminSelectedCustomerId(cust.id)}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-extrabold px-4 py-2 rounded-xl transition text-[11px]"
                              >
                                مشاهده و عملیات
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`آیا از حذف حساب کاربری «${cust.name}» و تمام تراکنش‌ها و اسناد مربوط به آن اطمینان کامل دارید؟`)) {
                                    setCustomers(customers.filter(c => c.id !== cust.id));
                                    setTransactions(transactions.filter(t => t.customerId !== cust.id));
                                  }
                                }}
                                className="text-slate-400 hover:text-red-600 p-1.5 rounded transition cursor-pointer"
                                title="حذف حساب"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                          مشتری مورد نظر یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================
            DETAILED CUSTOMER VIEW (IMAGE 1 REPLICA)
            ========================================= */}
        {(!showRoster && activeProfile) && (
          <div className="space-y-4">
            
            {/* Back button for Admin view */}
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setAdminSelectedCustomerId('')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 shrink-0 rotate-180" />
                <span>بازگشت به دفتر حساب‌ها (داشبورد اصلی)</span>
              </button>
            )}

            {/* Profile Overview Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-right">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                  {activeProfile.name[0]}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <span>{activeProfile.name}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full font-bold">
                      طرف حساب تجاری
                    </span>
                  </h2>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                    شناسه: CU-{activeProfile.id.toUpperCase()} • تلفن همراه: {activeProfile.mobile}
                  </span>
                </div>
              </div>

              {/* Action utilities bar (Image 1 top right) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 ml-1">عملیات سند:</span>
                <button
                  onClick={() => window.print()}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>چاپ کاردکس</span>
                </button>
                <button
                  onClick={() => alert('لینک فیش واتساپ صادر شد.')}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ارسال واتساپ</span>
                </button>
              </div>
            </div>

            {/* 5 Stats Cards Row (Image 1 Exact Layout) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">ارزش کل دارایی</span>
                <span className="text-sm font-black text-slate-950 font-mono block">
                  {formatNumber(myTotalAssets)}
                </span>
                <span className="text-[9px] text-slate-400 block">مجموع لوله مسی و نقدینگی</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">موجودی لوله مسی (ک‌گ)</span>
                <span className="text-sm font-black text-amber-800 font-mono block">
                  {formatKg(activeProfile.copperBalance)}
                </span>
                <span className="text-[9px] text-slate-400 block">ارزش روز: {formatNumber(activeProfile.copperBalance * buyCopperPrice)} ت</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">مانده ریالی کیف</span>
                <span className="text-sm font-black text-slate-950 font-mono block">
                  {formatNumber(activeProfile.walletCash)}
                </span>
                <span className="text-[9px] text-slate-400 block">نقدینگی در دسترس کیف</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                <span className="text-[10px] text-slate-500 block">سود محقق شده</span>
                <span className="text-sm font-black text-emerald-600 font-mono block">
                  +{formatNumber(activeProfile.realizedProfit)}+
                </span>
                <span className="text-[9px] text-emerald-500 block">بازدهی تجمیعی معاملات: {activeProfile.profitChangePercent}%+</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-right space-y-1">
                <span className="text-[10px] text-amber-900 block">اسناد درراه (چک صیاد)</span>
                <span className="text-sm font-black text-amber-950 font-mono block">
                  {formatNumber(activeProfile.inTransitChecks)}
                </span>
                <span className="text-[9px] text-amber-800 block">
                  {activeProfile.blockedCopper} چک صیادی مسدود لوله مسی
                </span>
              </div>

            </div>

            {/* Quick Action buttons (Image 1 design replica) - ONLY available for Admin */}
            {currentUser.role === 'admin' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold text-slate-400 block mb-3">عملیات سریع برای این حساب معاملاتی:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openActionModal('buy')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>+ خرید لوله مسی</span>
                  </button>
                  <button
                    onClick={() => openActionModal('sell')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>- فروش لوله مسی</span>
                  </button>
                  <button
                    onClick={() => openActionModal('deposit')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>📥 واریز وجه ریالی</span>
                  </button>
                  <button
                    onClick={() => openActionModal('withdraw')}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>📤 برداشت وجه ریالی</span>
                  </button>
                  <button
                    onClick={() => openActionModal('check')}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>✍️ ثبت چک صیادی</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustCashAmount('');
                      setAdjustCopperAmount('');
                      setAdjustReason('');
                      setActiveModal('adjust_account');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <span>🎛️ سند اصلاح حساب / تعدیل</span>
                  </button>
                </div>
              </div>
            )}

            {/* Read-only warning for clients inside their panel */}
            {currentUser.role === 'customer' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-amber-950">توجیح امنیتی حساب‌های صیادی و معاملات:</p>
                  <p className="leading-relaxed text-amber-900/90">
                    مشتری گرامی، جهت ثبت خرید جدید لوله مسی، فروش محصولات، شارژ فیزیکی حواله‌ها، تسویه ریالی یا تایید چک صیادی با واحد بازرگانی تماس بگیرید. اطلاعات فوق به شکل لحظه‌ای از کاردکس رسمی شما استخراج شده است.
                  </p>
                </div>
              </div>
            )}

            {/* Car-dex Table layout (Strict Image 1 Match with column naming) */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs lg:text-sm">ریزگردش معاملات و فاکتورهای حساب</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">اسناد صادر شده و کاردکس رسمی کالا</span>
                </div>

                {/* Subfilter tabs inside table header */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-black border">
                  <button 
                    onClick={() => setTxSubFilter('all')}
                    className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                  >
                    همه تراکنش‌ها ({myTransactions.length})
                  </button>
                  <button 
                    onClick={() => setTxSubFilter('buy')}
                    className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'buy' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                  >
                    خرید مس
                  </button>
                  <button 
                    onClick={() => setTxSubFilter('sell')}
                    className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'sell' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                  >
                    فروش مس
                  </button>
                  <button 
                    onClick={() => setTxSubFilter('deposit')}
                    className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'deposit' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                  >
                    واریزها
                  </button>
                  <button 
                    onClick={() => setTxSubFilter('withdraw')}
                    className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'withdraw' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'}`}
                  >
                    برداشت‌ها
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-3 px-4">ردیف</th>
                      <th className="py-3 px-4">تاریخ و زمان</th>
                      <th className="py-3 px-4">نوع سند و شرح معامله</th>
                      <th className="py-3 px-4">وزن (کیلوگرم)</th>
                      <th className="py-3 px-4">نرخ واحد (تومان)</th>
                      <th className="py-3 px-4">مبلغ کل (تومان)</th>
                      <th className="py-3 px-4">سود / بازدهی</th>
                      <th className="py-3 px-4">مانده ریالی بعد</th>
                      <th className="py-3 px-4">وضعیت</th>
                      <th className="py-3 px-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myTransactions.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-4 px-4 font-mono">
                          <span className="block text-slate-900">{tx.date}</span>
                          <span className="block text-[9px] text-slate-400 mt-0.5">{tx.time || '۰۹:۰۰:۳۶'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-extrabold text-slate-950 block">
                            {tx.type === 'buy' && '• خرید لوله مسی'}
                            {tx.type === 'sell' && '• فروش لوله مسی'}
                            {tx.type === 'check_register' && '• ثبت چک تضمین'}
                            {tx.type === 'adjustment' && '• سند اصلاح حساب'}
                            {tx.type === 'deposit' && '• شارژ نقدی حساب'}
                            {tx.type === 'withdraw' && '• برداشت وجه'}
                          </span>
                          <span className="text-[10px] text-slate-500 block max-w-xs truncate mt-0.5" title={tx.description}>
                            {tx.description}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold font-mono text-slate-900">
                          {tx.amountKg ? `${formatKg(tx.amountKg)} ک‌گ` : '-'}
                        </td>
                        <td className="py-4 px-4 font-bold font-mono text-slate-500">
                          {tx.ratePerKg ? `${formatNumber(tx.ratePerKg)} تومان` : '-'}
                        </td>
                        <td className="py-4 px-4 font-black font-mono text-slate-950">
                          {formatNumber(tx.totalAmount)}
                        </td>
                        <td className="py-4 px-4 font-bold font-mono">
                          {tx.profitVal ? (
                            <span className="text-emerald-600 block">+{formatNumber(tx.profitVal)} ت</span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 font-bold font-mono text-slate-800">
                          {tx.afterWalletCash !== undefined ? `${formatNumber(tx.afterWalletCash)}` : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100">
                            تأیید نهایی
                          </span>
                        </td>
                        <td className="py-4 px-4 text-left">
                          <button
                            onClick={() => {
                              setSelectedTx(tx);
                              setActiveModal('receipt');
                            }}
                            className="text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-600/30 px-2.5 py-1 rounded-lg transition font-bold text-[10px]"
                          >
                            فاکتور چاپی
                          </button>
                        </td>
                      </tr>
                    ))}
                    {myTransactions.length === 0 && (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400 font-medium">
                          هیچ سند تراکنشی با فیلتر انتخاب شده یافت نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* =========================================
          MODALS ZONE
          ========================================= */}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 text-white p-6 flex justify-between items-center">
              <div className="space-y-1">
                <h4 className="text-base font-black">حذف حساب کاربری</h4>
                <p className="text-xs text-red-100">این عملیات غیرقابل بازگشت است</p>
              </div>
              <button 
                onClick={() => setCustomerToDelete(null)}
                className="text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700 leading-relaxed text-right">
                آیا از حذف حساب کاربری <span className="font-extrabold text-slate-900 font-sans">«{customerToDelete.name}»</span> و تمامی تراکنش‌ها و اسناد مربوط به آن اطمینان کامل دارید؟
              </p>
              
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    const idToDelete = customerToDelete.id;
                    setCustomers(customers.filter(c => c.id !== idToDelete));
                    setTransactions(transactions.filter(t => t.customerId !== idToDelete));
                    supabase.from('customers').delete().eq('id', idToDelete).then();
                    setCustomerToDelete(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black py-2.5 rounded-xl transition text-xs shadow-sm shadow-red-600/20"
                >
                  بله، حذف شود
                </button>
                <button
                  onClick={() => setCustomerToDelete(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-5 rounded-xl transition text-xs"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. Modal: Register BUY copper */}
      {activeModal === 'buy' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">خرید</span>
                <h4 className="text-sm font-black tracking-tight text-white">ثبت خرید مس</h4>
              </div>
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitBuyCopper} className="p-6 space-y-4">
              
              {/* 1. وزن مس (کیلوگرم) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  وزن مس (کیلوگرم) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={buyWeight}
                    onChange={(e) => setBuyWeight(e.target.value)}
                    placeholder="مثال: ۵۰"
                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono text-center font-bold transition"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                    کیلوگرم
                  </div>
                </div>
              </div>

              {/* 2. قیمت هر کیلو (تومان) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  قیمت هر کیلوگرم (تومان) <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="text"
                    required
                    value={buyRate === 0 ? '' : formatNumber(buyRate)}
                    onChange={(e) => {
                      const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                      const num = parseFloat(raw);
                      setBuyRate(isNaN(num) ? 0 : num);
                    }}
                    placeholder="مثال: ۲,۱۵۰,۰۰۰"
                    className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-mono text-center font-bold transition"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                    تومان / ک‌گ
                  </div>
                </div>
              </div>

              {/* 3. کادر جمع کل فاکتور خرید */}
              {(() => {
                const kgInput = parseFloat(toEnglishDigits(buyWeight)) || 0;
                const totalCost = kgInput * buyRate;
                const currentWallet = activeProfile?.walletCash || 0;
                const remainingCash = currentWallet - totalCost;

                return (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md border border-slate-800 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">جمع کل فاکتور:</span>
                      <span className="font-mono text-amber-400 font-black text-base">
                        {formatNumber(totalCost)} <span className="text-xs font-sans text-amber-400/80">تومان</span>
                      </span>
                    </div>

                    {totalCost > 0 && (
                      <div className="text-[11px] text-amber-300 text-center font-bold bg-amber-950/40 py-1.5 px-3 rounded-xl border border-amber-900/30">
                        {numToPersianWords(totalCost)}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2.5">
                      <span className="text-slate-400 font-medium">مانده ریالی پس از خرید:</span>
                      <span className={`font-mono font-bold ${remainingCash < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {formatNumber(remainingCash)} تومان
                      </span>
                    </div>

                    {remainingCash < 0 && (
                      <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>موجودی ریالی کیف پول برای این خرید کافی نیست!</span>
                      </div>
                    )}
                    {companyWarehouseCopper < kgInput && (
                      <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>موجودی انبار مرکزی شرکت ({formatKg(companyWarehouseCopper)} ک‌گ) کافی نیست!</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl transition duration-150 text-xs shadow-md shadow-amber-600/10 cursor-pointer"
                >
                  ثبت فاکتور خرید
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition duration-150 text-xs cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Register SELL copper */}
      {activeModal === 'sell' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 my-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">فروش</span>
                <h4 className="text-sm font-black tracking-tight text-white">ثبت فروش مس</h4>
              </div>
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const selectedSeller = customers.find(c => c.id === (sellSellerId || adminSelectedCustomerId)) || customers[0];
              const sellerCopper = sellModel === 'individual' ? (selectedSeller?.copperBalance || 0) : totalCopperPool;
              const numericWeight = parseFloat(toEnglishDigits(sellWeight)) || 0;
              const totalRevenue = numericWeight * sellRate;
              const remainingCopper = sellerCopper - numericWeight;
              const profitVal = (sellRate - (selectedSeller?.averageBuyPrice || 0)) * numericWeight;

              return (
                <form onSubmit={submitSellCopper} className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                  
                  {/* 1. مدل فروش: تکی یا بورسی */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      مدل فروش مس <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSellModel('individual')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellModel === 'individual'
                            ? 'bg-white shadow-sm border border-slate-200 text-slate-950 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User className="w-3.5 h-3.5 text-slate-700" />
                        <span>فروش تکی (شخص)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSellModel('bourse')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellModel === 'bourse'
                            ? 'bg-emerald-600 text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>فروش بورسی (تسهیم)</span>
                      </button>
                    </div>

                    {/* Customer select if individual */}
                    {sellModel === 'individual' && (
                      <div className="mt-2">
                        <select
                          value={sellSellerId || adminSelectedCustomerId}
                          onChange={(e) => setSellSellerId(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              فروشنده: {c.name} (موجودی مس: {formatKg(c.copperBalance)} کیلوگرم)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* 2. مقصد فروش: به داخل یا به خارج */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      مقصد فروش مس <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSellDestination('internal')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellDestination === 'internal'
                            ? 'bg-white shadow-sm border border-slate-200 text-slate-950 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        <span>فروش به داخل (شرکت)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSellDestination('external')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellDestination === 'external'
                            ? 'bg-white shadow-sm border border-slate-200 text-slate-950 font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                        <span>فروش به خارج (خریدار بیرونی)</span>
                      </button>
                    </div>

                    {/* Buyer name input if external */}
                    {sellDestination === 'external' && (
                      <div className="mt-2 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          نام شخص یا شرکت خریدار <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={externalBuyerName}
                          onChange={(e) => setExternalBuyerName(e.target.value)}
                          placeholder="مثلاً: آقای سهرابی، کارگاه ابزار، یا نام شرکت خریدار..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. نحوه تسویه: نقدی یا چکی */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      نحوه تسویه وجه معامله <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setSellPaymentType('cash')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellPaymentType === 'cash'
                            ? 'bg-emerald-600 text-white shadow-sm font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        <span>تسویه نقدی (کیف پول)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSellPaymentType('check')}
                        className={`py-2 px-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          sellPaymentType === 'check'
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>دریافت چک</span>
                      </button>
                    </div>

                    {/* Check fields if check */}
                    {sellPaymentType === 'check' && (
                      <div className="mt-2.5 p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-2.5 animate-in fade-in duration-150">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                              تاریخ سررسید چک <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={sellCheckDueDate}
                                onChange={(e) => setSellCheckDueDate(e.target.value)}
                                placeholder="۱۴۰۳/۱۲/۲۸"
                                className="w-full p-2.5 pl-8 bg-white border border-amber-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                              شماره چک / شناسه صیاد <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sellCheckNumber}
                              onChange={(e) => setSellCheckNumber(e.target.value)}
                              placeholder="مثال: ۱۲۳۴۵۶۷۸۹"
                              className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-mono text-center text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-700 mb-1">
                            نام بانک صادرکننده
                          </label>
                          <input
                            type="text"
                            value={sellCheckBank}
                            onChange={(e) => setSellCheckBank(e.target.value)}
                            placeholder="مثال: بانک ملی، ملت، تجارت..."
                            className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. تاریخ معامله */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      تاریخ فروش <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={sellDate}
                        onChange={(e) => setSellDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۷/۱۱"
                        className="w-full p-2.5 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* 5. وزن مس و قیمت هر کیلوگرم */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* وزن مس */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-black text-slate-800">
                          وزن مس <span className="text-red-500">*</span>
                        </label>
                        {sellerCopper > 0 && (
                          <button
                            type="button"
                            onClick={() => setSellWeight(sellerCopper.toString())}
                            className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            کل ({formatKg(sellerCopper)})
                          </button>
                        )}
                      </div>
                      <div className="relative rounded-xl shadow-sm">
                        <input
                          type="text"
                          required
                          value={sellWeight}
                          onChange={(e) => setSellWeight(e.target.value)}
                          placeholder="مثال: ۴۰"
                          className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono text-center font-bold transition"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[10px] text-slate-400 font-bold">
                          ک‌گ
                        </div>
                      </div>
                    </div>

                    {/* قیمت هر کیلو */}
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1.5">
                        قیمت هر کیلو (تومان) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <input
                          type="text"
                          required
                          value={sellRate === 0 ? '' : formatNumber(sellRate)}
                          onChange={(e) => {
                            const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                            const num = parseFloat(raw);
                            setSellRate(isNaN(num) ? 0 : num);
                          }}
                          placeholder="مثال: ۲,۳۰۰,۰۰۰"
                          className="w-full pl-14 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-mono text-center font-bold transition"
                        />
                        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[10px] text-slate-400 font-bold">
                          تومان
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. کادر جمع کل فاکتور فروش */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-md border border-slate-800 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">جمع کل فاکتور فروش:</span>
                      <span className="font-mono text-emerald-400 font-black text-base">
                        {formatNumber(totalRevenue)} <span className="text-xs font-sans text-emerald-400/80">تومان</span>
                      </span>
                    </div>

                    {totalRevenue > 0 && (
                      <div className="text-[11px] text-emerald-300 text-center font-bold bg-emerald-950/40 py-1.5 px-3 rounded-xl border border-emerald-900/30">
                        {numToPersianWords(totalRevenue)}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400 font-medium">مانده مس پس از فروش:</span>
                      <span className={`font-mono font-bold ${remainingCopper < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {formatKg(Math.max(0, remainingCopper))} کیلوگرم
                      </span>
                    </div>

                    {numericWeight > 0 && profitVal !== undefined && (
                      <div className="flex justify-between items-center text-xs border-t border-slate-800/50 pt-2 text-slate-400 font-medium">
                        <span>سود تخمینی معامله:</span>
                        <span className={`font-mono font-bold ${profitVal >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {profitVal >= 0 ? `+${formatNumber(profitVal)}` : formatNumber(profitVal)} تومان
                        </span>
                      </div>
                    )}

                    {sellerCopper < numericWeight && (
                      <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>موجودی مس ({formatKg(sellerCopper)} ک‌گ) برای این فروش کافی نیست!</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3 rounded-xl transition duration-150 text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      ثبت فاکتور فروش
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition duration-150 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </form>
              );
            })()}

          </div>
        </div>
      )}

      {/* 3. Modal: Register Check */}
      {activeModal === 'check' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header: Indigo/slate dark styling with badge */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 flex justify-between items-center shadow-sm">
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">ثبت چک صیادی و مسدود مس</h3>
                  <p className="text-xs text-slate-300 mt-0.5">ثبت چک ضمانتی صیاد، اسناد درراه و توقف معامله مس</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/60 backdrop-blur border border-indigo-400/30 text-indigo-200 flex items-center justify-center shadow-inner">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
            </div>

            {(() => {
              const selectedTarget = customers.find(c => c.id === adminSelectedCustomerId) || customers[0];
              const checkVal = parseFloat(toEnglishDigits(checkAmount.replace(/,/g, ''))) || 0;

              return (
                <form onSubmit={submitRegisterCheck} className="p-5 md:p-6 space-y-4">
                  
                  {/* طرف حساب */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      طرف حساب / صاحب چک <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={adminSelectedCustomerId || customers[0]?.id}
                        onChange={(e) => setAdminSelectedCustomerId(e.target.value)}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (مس در انبار: {formatKg(c.copperBalance)} کیلوگرم)
                          </option>
                        ))}
                      </select>
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* مبلغ چک */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      مبلغ چک صیادی (تومان) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        value={checkAmount}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                          const num = parseFloat(raw);
                          setCheckAmount(isNaN(num) ? '' : formatNumber(num));
                        }}
                        placeholder="مثال: ۵۰۰,۰۰۰,۰۰۰"
                        className="w-full pl-14 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center font-bold"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                        تومان
                      </div>
                    </div>
                    {checkVal > 0 && (
                      <div className="text-left pt-0.5">
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1 rounded-lg text-[10px] font-bold inline-block">
                          {numToPersianWords(checkVal)} تومان
                        </span>
                      </div>
                    )}
                  </div>

                  {/* شماره صیاد / شناسه چک */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      شناسه ۱۶ رقمی چک صیادی <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={checkNum}
                        onChange={(e) => setCheckNum(e.target.value)}
                        placeholder="مثال: ۴۲۰۴ - ۵۶۲۸ - ۱۲۹۰ - ۰۳۴۱"
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono text-center font-bold tracking-widest"
                      />
                      <Tag className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* توضیحات چک */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">
                      بابت چک و توضیحات تضمین
                    </label>
                    <div className="relative">
                      <textarea
                        value={checkDesc}
                        onChange={(e) => setCheckDesc(e.target.value)}
                        placeholder="چک تضمین جهت دریافت و بارگیری لوله مسی، شماره حواله..."
                        rows={2}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                      />
                      <FileText className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-950 flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      با ثبت این چک، مبلغ به ستون <strong>«اسناد درراه»</strong> اضافه شده و ۱ عدد وضعیت <strong>«مسدود مس»</strong> برای این شخص منظور می‌گردد.
                    </span>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-6 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span>ثبت چک صیادی و مسدود مس</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition duration-150 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>

                </form>
              );
            })()}

          </div>
        </div>
      )}

      {/* 4. Modal: Deposit */}
      {activeModal === 'deposit' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">واریز</span>
                <h4 className="text-sm font-black tracking-tight text-white">ثبت واریز وجه به کیف پول</h4>
              </div>
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const selectedTarget = customers.find(c => c.id === (depositCustomerId || adminSelectedCustomerId)) || customers[0];
              const depositVal = parseFloat(toEnglishDigits(depositAmount.replace(/,/g, ''))) || 0;
              const currentCash = selectedTarget?.walletCash || 0;
              const projectedCash = currentCash + depositVal;

              return (
                <form onSubmit={submitDeposit} className="p-6 space-y-4">
                  
                  {/* 1. مبلغ واریزی (تومان) */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      مبلغ واریزی (تومان) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={depositAmount}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                          const num = parseFloat(raw);
                          setDepositAmount(isNaN(num) ? '' : formatNumber(num));
                        }}
                        placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
                        className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono text-center font-bold transition"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                        تومان
                      </div>
                    </div>

                    {/* Word Conversion */}
                    {depositVal > 0 && (
                      <div className="text-left pt-1.5">
                        <span className="text-[11px] text-emerald-700 font-bold">
                          {numToPersianWords(depositVal)} تومان
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. تاریخ واریز */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      تاریخ واریز <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۷/۱۱"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-mono text-center font-bold transition"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. کادر خلاصه وضعیت مانده */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-md border border-slate-800 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">موجودی فعلی کیف پول:</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {formatNumber(currentCash)} تومان
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400 font-bold">موجودی پس از واریز:</span>
                      <span className="font-mono text-emerald-400 font-black text-sm">
                        {formatNumber(projectedCash)} <span className="text-xs font-sans text-emerald-400/80">تومان</span>
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black py-3 rounded-xl transition duration-150 text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
                    >
                      ثبت واریز وجه
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition duration-150 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>

                </form>
              );
            })()}

          </div>
        </div>
      )}

      {/* 5. Modal: Withdraw */}
      {activeModal === 'withdraw' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-md">برداشت</span>
                <h4 className="text-sm font-black tracking-tight text-white">ثبت برداشت وجه از کیف پول</h4>
              </div>
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const selectedTarget = customers.find(c => c.id === (withdrawCustomerId || adminSelectedCustomerId)) || customers[0];
              const withdrawVal = parseFloat(toEnglishDigits(withdrawAmount.replace(/,/g, ''))) || 0;
              const currentCash = selectedTarget?.walletCash || 0;
              const remainingCash = currentCash - withdrawVal;

              return (
                <form onSubmit={submitWithdraw} className="p-6 space-y-4">
                  
                  {/* 1. مبلغ برداشتی (تومان) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-black text-slate-800">
                        مبلغ برداشتی (تومان) <span className="text-red-500">*</span>
                      </label>
                      {currentCash > 0 && (
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(formatNumber(currentCash))}
                          className="text-[11px] font-black text-rose-600 hover:text-rose-700 cursor-pointer"
                        >
                          کل موجودی ({formatNumber(currentCash)} ت)
                        </button>
                      )}
                    </div>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        autoFocus
                        value={withdrawAmount}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                          const num = parseFloat(raw);
                          setWithdrawAmount(isNaN(num) ? '' : formatNumber(num));
                        }}
                        placeholder="مثال: ۵۰,۰۰۰,۰۰۰"
                        className="w-full pl-16 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-center font-bold transition"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                        تومان
                      </div>
                    </div>

                    {/* Word Conversion */}
                    {withdrawVal > 0 && (
                      <div className="text-left pt-1.5">
                        <span className="text-[11px] text-rose-700 font-bold">
                          {numToPersianWords(withdrawVal)} تومان
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 2. تاریخ برداشت */}
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1.5">
                      تاریخ برداشت <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        required
                        value={withdrawDate}
                        onChange={(e) => setWithdrawDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۷/۱۱"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm font-mono text-center font-bold transition"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 3. کادر خلاصه وضعیت مانده */}
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2.5 shadow-md border border-slate-800 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">موجودی فعلی کیف پول:</span>
                      <span className="font-mono text-slate-200 font-bold">
                        {formatNumber(currentCash)} تومان
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400 font-bold">مانده پس از برداشت:</span>
                      <span className={`font-mono font-black text-sm ${remainingCash < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                        {formatNumber(remainingCash)} <span className="text-xs font-sans">تومان</span>
                      </span>
                    </div>

                    {currentCash < withdrawVal && (
                      <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-800/40 text-red-300 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                        <span>موجودی کیف پول ({formatNumber(currentCash)} تومان) برای این برداشت کافی نیست!</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-3 rounded-xl transition duration-150 text-xs shadow-md shadow-rose-600/10 cursor-pointer"
                    >
                      ثبت برداشت وجه
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition duration-150 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>

                </form>
              );
            })()}

          </div>
        </div>
      )}

      {/* 6. Modal: Add Customer */}
      {activeModal === 'add_customer' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <h4 className="text-base font-black">تعریف حساب کاربری جدید</h4>
                <p className="text-xs text-slate-400">رمز عبور پیش‌فرض کاربر پس از ثبت ۱۲۳۴ خواهد بود</p>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-white hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitNewCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام و نام خانوادگی مشتری *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره تلفن همراه *</label>
                <input
                  type="text"
                  required
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  placeholder="مثال: 09121112233"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-1 focus:ring-amber-500 text-xs font-mono text-center"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 rounded-xl transition text-xs"
                >
                  افزودن و ایجاد پنل
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition text-xs"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Modal: Printable Receipt/Invoice */}
      {activeModal === 'receipt' && selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-100 p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                  و
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-bold text-slate-900">فاکتور رسمی معامله لوله مسی</h4>
                  <span className="text-[10px] text-slate-400 block">پلتفرم جامع معاملات مس و اته</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setActiveModal(null);
                  setSelectedTx(null);
                }}
                className="text-slate-400 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Invoice fields */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block">طرف حساب معامله:</span>
                <span className="font-black text-slate-900 block mt-0.5">{selectedTx.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">تاریخ ثبت سند:</span>
                <span className="font-mono text-slate-900 block mt-0.5">{selectedTx.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block">شماره سند معاملاتی:</span>
                <span className="font-mono text-slate-900 block mt-0.5">{selectedTx.id}</span>
              </div>
              <div>
                <span className="text-slate-400 block">نوع تراکنش:</span>
                <span className="font-bold text-slate-950 block mt-0.5">
                  {selectedTx.type === 'buy' && 'خرید لوله مسی'}
                  {selectedTx.type === 'sell' && 'فروش لوله مسی'}
                  {selectedTx.type === 'check_register' && 'ثبت چک صیادی ضمانت'}
                  {selectedTx.type === 'adjustment' && 'سند اصلاح حساب'}
                  {selectedTx.type === 'deposit' && 'شارژ نقدی حساب'}
                  {selectedTx.type === 'withdraw' && 'برداشت وجه ریالی'}
                </span>
              </div>
            </div>

            {/* Amount details */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-100 p-3 text-[11px] font-bold text-slate-700 text-center">
                <span>شرح کالا / خدمات</span>
                <span>مقدار معامله</span>
                <span>مبلغ نهایی معامله</span>
              </div>
              <div className="grid grid-cols-3 p-4 text-xs text-center border-t border-slate-100 font-bold text-slate-800">
                <span>
                  {selectedTx.type === 'buy' && 'لوله مسی فیزیکی'}
                  {selectedTx.type === 'sell' && 'لوله مسی فیزیکی'}
                  {selectedTx.type === 'check_register' && 'سند تضمینی چک صیادی'}
                  {selectedTx.type === 'adjustment' && 'سند اصلاح حساب'}
                  {selectedTx.type === 'deposit' && 'شارژ کیف پول ریالی'}
                  {selectedTx.type === 'withdraw' && 'تسویه نقدی ریالی'}
                </span>
                <span>
                  {selectedTx.amountKg ? `${formatKg(selectedTx.amountKg)} کیلوگرم` : '-'}
                </span>
                <span className="font-black text-slate-950">
                  {formatNumber(selectedTx.totalAmount)} تومان
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
              <span className="font-bold text-amber-900 block mb-0.5">شرح و فیش صادر شده:</span>
              <span>{selectedTx.description}</span>
              {selectedTx.checkNumber && (
                <span className="block font-bold text-slate-900 mt-1 font-mono text-xs">
                  شناسه چک صیادی مسدود شده: {selectedTx.checkNumber}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ فاکتور رسمی</span>
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setSelectedTx(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded-xl transition text-xs"
              >
                بستن فاکتور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: "سند اصلاح حساب و تعدیل موجودی" */}
      {activeModal === 'adjust_account' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header: Clean slate background, charcoal badge with Sliders, Title, Subtitle, and Close button */}
            <div className="bg-slate-50/70 border-b border-slate-100 p-5 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-xl bg-white text-slate-400 hover:text-slate-700 border border-slate-200/60 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-900">سند اصلاح حساب و تعدیل موجودی</h3>
                  <p className="text-xs text-slate-500 mt-0.5">تعدیل دستی موجودی ریالی یا وزن مس با ثبت دلیل</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <Sliders className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {(() => {
              const selectedTarget = customers.find(c => c.id === (adjustCustomerId || adminSelectedCustomerId)) || customers[0];

              return (
                <form onSubmit={submitAdjustment} className="p-5 md:p-6 space-y-4">
                  
                  {/* 1. نام فرد / طرف حساب * */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      نام فرد / طرف حساب <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={adjustCustomerId || adminSelectedCustomerId}
                        onChange={(e) => setAdjustCustomerId(e.target.value)}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-1 focus:ring-slate-500"
                      >
                        <option value="">-- انتخاب طرف حساب --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. Status Banner: موجودی ریالی فعلی & موجودی مس فعلی */}
                  <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      موجودی ریالی فعلی: <strong className="font-mono text-slate-900 font-bold">{formatNumber(selectedTarget?.walletCash || 0)} تومان</strong>
                    </span>
                    <span className="text-amber-800 font-bold">
                      موجودی مس فعلی: <strong className="font-mono font-bold text-amber-900">{formatKg(selectedTarget?.copperBalance || 0)} کیلوگرم</strong>
                    </span>
                  </div>

                  {/* 3. تاریخ ثبت اصلاح * */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      تاریخ ثبت اصلاح <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={adjustDate}
                        onChange={(e) => setAdjustDate(e.target.value)}
                        placeholder="۱۴۰۵/۰۷/۱۱"
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 4. تعدیل موجودی ریالی (تومان): */}
                  <div className="bg-slate-50/60 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdjustCashMode('increase')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            adjustCashMode === 'increase'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          + افزایش
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustCashMode('decrease')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            adjustCashMode === 'decrease'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          - کاهش
                        </button>
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        تعدیل موجودی ریالی (تومان):
                      </span>
                    </div>

                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        value={adjustCashAmount}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                          const num = parseFloat(raw);
                          setAdjustCashAmount(isNaN(num) ? '' : formatNumber(num));
                        }}
                        placeholder="۰"
                        className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500 text-xs font-mono text-center font-bold"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                        تومان
                      </div>
                    </div>
                  </div>

                  {/* 5. تعدیل وزن مس (کیلوگرم): */}
                  <div className="bg-amber-50/20 border border-amber-300/80 p-3.5 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAdjustCopperMode('increase')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            adjustCopperMode === 'increase'
                              ? 'bg-[#b45309] text-white shadow-sm'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          + افزایش
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustCopperMode('decrease')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            adjustCopperMode === 'decrease'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          - کاهش
                        </button>
                      </div>
                      <span className="text-xs font-bold text-amber-950">
                        تعدیل وزن مس (کیلوگرم):
                      </span>
                    </div>

                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        value={adjustCopperAmount}
                        onChange={(e) => setAdjustCopperAmount(e.target.value)}
                        placeholder="۰"
                        className="w-full pl-16 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono text-center font-bold"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                        کیلوگرم
                      </div>
                    </div>
                  </div>

                  {/* 6. علت اصلاح حساب * (الزامی) */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-red-600">
                      علت اصلاح حساب * (الزامی)
                    </label>
                    <div className="relative">
                      <textarea
                        required
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="دلیل اصلاح (مثلاً: تخفیف ویژه، خطای ثبت قبلی، افت بار و پرتی، تسویه دستی...)"
                        rows={2.5}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                      <FileText className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black py-3.5 px-6 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>ثبت سند اصلاح حساب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition duration-150 text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>

                </form>
              );
            })()}

          </div>
        </div>
      )}

      {/* 9. MODAL: "مدیریت و تنظیم موجودی مس شرکت" */}
      {activeModal === 'company_stock' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-amber-600 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center text-white shadow-sm">📦</div>
                <div className="text-right">
                  <h4 className="text-sm font-black">مدیریت و تنظیم موجودی لوله مسی شرکت</h4>
                  <p className="text-[10px] text-amber-100">تعیین موجودی فیزیکی آماده تحویل در انبار مرکزی مس و اته</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveModal(null)} className="text-amber-100 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitCompanyStockRegulation} className="p-6 space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCompanyStockMode('set');
                    setCompanyStockInput(companyWarehouseCopper.toString());
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all ${companyStockMode === 'set' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  تنظیم موجودی جدید (کیلوگرم / تن)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyStockMode('charge');
                    setCompanyStockInput('1000');
                  }}
                  className={`flex-1 py-2 rounded-lg transition-all ${companyStockMode === 'charge' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  افزایش / شارژ انبار (+کیلوگرم)
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-extrabold text-slate-800">
                  {companyStockMode === 'set' ? 'موجودی کل انبار شرکت (کیلوگرم):' : 'وزن جهت شارژ انبار (کیلوگرم):'}
                </label>
                <input
                  type="text"
                  required
                  value={companyStockInput}
                  onChange={(e) => setCompanyStockInput(e.target.value)}
                  placeholder="مثال: ۲۰۰۰"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-950 font-mono text-center font-black text-sm"
                />
                <span className="block text-[10px] text-slate-400 text-center font-bold mt-1">
                  مساوی با {formatKg((parseFloat(toEnglishDigits(companyStockInput)) || 0) / 1000)} تن مس خالص
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-slate-700">دکمه‌های انتخاب سریع:</span>
                <div className="grid grid-cols-4 gap-2">
                  <button type="button" onClick={() => { setCompanyStockMode('set'); setCompanyStockInput('2000'); }} className="py-2 text-[10px] font-black rounded-lg border border-amber-300 bg-amber-50 text-amber-900">۲ تن (۲۰۰۰ کیلو)</button>
                  <button type="button" onClick={() => { setCompanyStockMode('set'); setCompanyStockInput('5000'); }} className="py-2 text-[10px] font-black rounded-lg border border-amber-300 bg-amber-50 text-amber-900">۵ تن (۵۰۰۰ کیلو)</button>
                  <button type="button" onClick={() => { setCompanyStockMode('charge'); setCompanyStockInput('5000'); }} className="py-2 text-[10px] font-black rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900">۵۰۰۰ کیلو شارژ</button>
                  <button type="button" onClick={() => { setCompanyStockMode('charge'); setCompanyStockInput('1000'); }} className="py-2 text-[10px] font-black rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900">+۱ تن شارژ</button>
                </div>
              </div>

              {(() => {
                const numericInput = parseFloat(toEnglishDigits(companyStockInput)) || 0;
                const newCompanyStock = companyStockMode === 'set' ? numericInput : (companyWarehouseCopper + numericInput);
                const estimatedStockValue = newCompanyStock * buyCopperPrice;

                return (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5 font-bold text-xs border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>موجودی فعلی لوله مسی شرکت:</span>
                      <span className="font-mono text-white">{formatKg(companyWarehouseCopper)} کیلوگرم</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2.5 text-amber-400">
                      <span>موجودی جدید انبار:</span>
                      <span className="font-mono text-amber-400">{formatKg(newCompanyStock)} کیلو ({formatKg(newCompanyStock / 1000)} تن)</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2.5 text-emerald-400">
                      <span>ارزش کل موجودی انبار:</span>
                      <span className="font-mono text-emerald-400">{formatNumber(estimatedStockValue)} تومان</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-between gap-4">
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ثبت و ذخیره موجودی لوله مسی</span>
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="text-xs text-slate-600 hover:text-slate-950 font-bold transition px-4">انصراف</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: "تنظیم قیمت‌های مرجع روز لوله مسی در بازار" (Image 3 EXACT MATCH Replica) */}
      {activeModal === 'market_price_settings' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200">
            
            {/* Header matching Charcoal bg and gold icons */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-950/80 text-amber-500 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-sm font-black">تنظیم قیمت‌های مرجع روز مس در بازار</h4>
                  <p className="text-[10px] text-slate-400">تعیین نرخ پیش‌فرض خرید و فروش در فاکتورها و ارزش‌گذاری انبار</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveMarketPriceSettings} className="p-6 space-y-6">
              
              {/* Box 1: BUY reference rate */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-extrabold text-amber-950">قیمت مرجع خرید مس (تومان / کیلوگرم) *</span>
                  </div>
                  <span className="text-[9px] text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded font-bold">دیفالت فرم ثبت خرید</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formatNumber(tempBuyPrice)}
                    onChange={(e) => {
                      const val = parseFloat(toEnglishDigits(e.target.value.replace(/,/g, '')));
                      setTempBuyPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full p-3 bg-white border-2 border-amber-500 rounded-xl text-slate-950 text-center font-black text-sm font-mono focus:outline-none"
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">تومان/کیلو</span>
                </div>

                <div className="text-[10px] text-amber-800 text-center font-bold">
                  {numToPersianWords(tempBuyPrice)}
                </div>

                {/* Common buying rates */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block font-bold">نرخ‌های رایج خرید مس:</span>
                  <div className="flex flex-wrap gap-1">
                    {[2800000, 2830000, 2850000, 2900000, 3000000, 3100000, 3200000].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTempBuyPrice(p)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${tempBuyPrice === p ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      >
                        {formatNumber(p)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: SELL reference rate */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-extrabold text-emerald-950">قیمت مرجع فروش مس (تومان / کیلوگرم) *</span>
                  </div>
                  <span className="text-[9px] text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded font-bold">دیفالت فرم ثبت فروش</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formatNumber(tempSellPrice)}
                    onChange={(e) => {
                      const val = parseFloat(toEnglishDigits(e.target.value.replace(/,/g, '')));
                      setTempSellPrice(isNaN(val) ? 0 : val);
                    }}
                    className="w-full p-3 bg-white border-2 border-emerald-500 rounded-xl text-slate-950 text-center font-black text-sm font-mono focus:outline-none"
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs text-slate-400">تومان/کیلو</span>
                </div>

                <div className="text-[10px] text-emerald-800 text-center font-bold">
                  {numToPersianWords(tempSellPrice)}
                </div>

                {/* Common selling rates */}
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 block font-bold">نرخ‌های رایج فروش مس:</span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setTempSellPrice(tempBuyPrice)}
                      className="px-2 py-1 text-[10px] font-black rounded-lg border bg-white hover:bg-slate-50 text-slate-700"
                    >
                      هم‌قیمت خرید
                    </button>
                    <button
                      type="button"
                      onClick={() => setTempSellPrice(tempBuyPrice - 150000)}
                      className={`px-2 py-1 text-[10px] font-black rounded-lg border transition ${(tempBuyPrice - tempSellPrice === 150000) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                    >
                      ۱۵۰ هزار کمتر
                    </button>
                    {[2850000, 3000000, 3100000, 3200000].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTempSellPrice(p)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition ${tempSellPrice === p ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
                      >
                        {formatNumber(p)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 3: Spread calculation info */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs text-slate-800 font-bold">
                <span className="flex items-center gap-1.5">
                  🔄 اختلاف نرخ خرید و فروش (اسپرد):
                </span>
                <span className="font-mono text-slate-950 font-black text-sm">
                  {formatNumber(Math.abs(tempBuyPrice - tempSellPrice))} تومان
                </span>
              </div>

              {/* Form submit actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl text-xs"
                >
                  ثبت قیمت‌های مرجع روز بازار
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-2xl text-xs"
                >
                  انصراف
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL: "تغییر رمز عبور حساب کاربری" (Change Password) */}
      {activeModal === 'change_password' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header: Dark slate background with amber lock badge */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shadow-sm">
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">تغییر رمز عبور حساب</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">افزایش امنیت دسترسی به پنل کاربری</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-400 flex items-center justify-center shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 md:p-6 space-y-4">
              
              {/* User info banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{currentUser.name}</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>کاربر جاری:</span>
                </span>
              </div>

              {/* 1. رمز عبور فعلی */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  رمز عبور فعلی <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="رمز عبور فعلی حساب..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 2. رمز عبور جدید */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  رمز عبور جدید <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* 3. تکرار رمز عبور جدید */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  تکرار رمز عبور جدید <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="password"
                    required
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="تکرار رمز عبور جدید..."
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs font-mono"
                  />
                  <CheckCircle2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Error box */}
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              {/* Success box */}
              {passwordSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Footer action buttons */}
              <div className="pt-2 flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>ثبت و تغییر رمز عبور</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition duration-150 text-xs cursor-pointer"
                >
                  انصراف
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
