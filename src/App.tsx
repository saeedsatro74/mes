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
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { supabase, DbCustomer, DbTransaction, DbCompanySettings } from './lib/supabase';
import { ShamsiDatePicker, toEnglishDigits, toPersianDigits, getTodayShamsi, getOffsetShamsiDate, getPersianDayOfWeek } from './components/ShamsiDatePicker';
import { WattehLogo } from './components/WattehLogo';

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
    walletCash: 0,
    copperBalance: 322.01,
    sharePercentage: 40.56,
    realizedProfit: 284547109,
    profitChangePercent: 27.3,
    averageBuyPrice: 3240000,
    inTransitChecks: 0,
    blockedCopper: 0,
  },
  {
    id: 'c2',
    name: 'شقایق شفیع',
    mobile: '09191628233',
    walletCash: 0,
    copperBalance: 32.26,
    sharePercentage: 4.06,
    realizedProfit: 0,
    profitChangePercent: 0,
    averageBuyPrice: 3100000,
    inTransitChecks: 0,
    blockedCopper: 0,
  },
  {
    id: 'c3',
    name: 'علی ظفری پور',
    mobile: '09134263654',
    walletCash: 0,
    copperBalance: 310.94,
    sharePercentage: 39.17,
    realizedProfit: 9273000,
    profitChangePercent: 3.1,
    averageBuyPrice: 2830000,
    inTransitChecks: 0,
    blockedCopper: 0,
  },
  {
    id: 'c4',
    name: 'مرتضی محمدی',
    mobile: '09936300529',
    walletCash: 0,
    copperBalance: 128.69,
    sharePercentage: 16.21,
    realizedProfit: 24560000,
    profitChangePercent: 8.5,
    averageBuyPrice: 3100000,
    inTransitChecks: 0,
    blockedCopper: 0,
  }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // 16 Transactions for Javad Shokrollahi (c1)
  { id: 'tx_j1', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'buy', date: '1405/06/23', time: '14:30', amountKg: 124.25, ratePerKg: 3240000, totalAmount: 402570000, status: 'completed', afterWalletCash: 0, description: 'خرید مس - فروشنده: شرکت مس واته' },
  { id: 'tx_j2', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'buy', date: '1405/06/16', time: '11:15', amountKg: 68.31, ratePerKg: 3100000, totalAmount: 211765000, status: 'completed', afterWalletCash: 402570000, description: 'خرید مس - فروشنده: شرکت مس واته' },
  { id: 'tx_j3', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '18:45', amountKg: 17.80, ratePerKg: 3100000, totalAmount: 55180000, profitVal: 6148252, status: 'completed', afterWalletCash: 614335000, description: 'فروش به خارج (خریدار بیرونی)' },
  { id: 'tx_j4', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '17:20', amountKg: 29.10, ratePerKg: 3200000, totalAmount: 93120000, profitVal: 12961355, status: 'completed', afterWalletCash: 559155000, description: 'فروش به خارج (خریدار بیرونی)' },
  { id: 'tx_j5', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '16:10', amountKg: 127.80, ratePerKg: 3150000, totalAmount: 402570000, profitVal: 50533065, status: 'completed', afterWalletCash: 466035000, description: 'فروش به خارج (خریدار بیرونی)' },
  { id: 'tx_j6', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '15:00', amountKg: 156, ratePerKg: 3300000, totalAmount: 514800000, profitVal: 85083553, status: 'completed', afterWalletCash: 63465000, description: 'فروش به خارج (خریدار بیرونی)' },
  { id: 'tx_j7', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '14:10', amountKg: 2.30, ratePerKg: 3000000, totalAmount: 6900000, profitVal: 564437, status: 'completed', afterWalletCash: 63465000, description: 'فروش به انبار شرکت (تحویل به شرکت) - درخواست فروش ۲.۳۰ کیلوگرم مس با نرخ ۳,۰۰۰,۰۰۰ تومان' },
  { id: 'tx_j8', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '13:30', amountKg: 21.10, ratePerKg: 2850000, totalAmount: 60135000, profitVal: 2013096, status: 'completed', afterWalletCash: 56565000, description: 'فروش به انبار شرکت (تحویل به شرکت) - درخواست فروش ۲۱.۱۰ کیلوگرم مس با نرخ ۲,۸۵۰,۰۰۰ تومان' },
  { id: 'tx_j9', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'buy', date: '1405/06/15', time: '12:00', amountKg: 353.36, ratePerKg: 2830000, totalAmount: 1000000000, status: 'completed', afterWalletCash: 0, description: 'درخواست خرید مس با بودجه ۱,۰۰۰,۰۰۰,۰۰۰ تومان معادل ۳۵۳.۳۶ کیلوگرم' },
  { id: 'tx_j10', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '11:20', amountKg: 4.40, ratePerKg: 2950000, totalAmount: 12980000, profitVal: 1760042, status: 'completed', afterWalletCash: 996430000, description: 'فروش به انبار شرکت (تحویل به شرکت) - درخواست فروش ۴.۴۰ کیلوگرم مس با نرخ ۲,۹۵۰,۰۰۰ تومان' },
  { id: 'tx_j11', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '10:40', amountKg: 21.10, ratePerKg: 2800000, totalAmount: 59080000, profitVal: 5375302, status: 'completed', afterWalletCash: 983450000, description: 'درخواست فروش ۲۱.۱۰ کیلوگرم مس با نرخ ۲,۸۰۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_j12', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '10:15', amountKg: 1.80, ratePerKg: 3200000, totalAmount: 5760000, profitVal: 1170017, status: 'completed', afterWalletCash: 924370000, description: 'درخواست فروش ۱.۸۰ کیلوگرم مس با نرخ ۳,۲۰۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_j13', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '09:50', amountKg: 53.10, ratePerKg: 3100000, totalAmount: 164610000, profitVal: 29305508, status: 'completed', afterWalletCash: 918610000, description: 'درخواست فروش ۵۳.۱۰ کیلوگرم مس با نرخ ۳,۱۰۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_j14', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'sell', date: '1405/06/15', time: '09:10', amountKg: 260, ratePerKg: 2900000, totalAmount: 754000000, profitVal: 91002486, status: 'completed', afterWalletCash: 754000000, description: 'درخواست فروش ۲۶۰ کیلوگرم مس با نرخ ۲,۹۰۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_j15', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'buy', date: '1405/06/15', time: '08:30', amountKg: 470.59, ratePerKg: 2550000, totalAmount: 1200000000, status: 'completed', afterWalletCash: 0, description: 'درخواست خرید مس با بودجه ۱,۲۰۰,۰۰۰,۰۰۰ تومان معادل ۴۷۰.۵۹ کیلوگرم' },
  { id: 'tx_j16', customerId: 'c1', customerName: 'جواد شکرالهی', type: 'deposit', date: '1405/06/15', time: '08:00', totalAmount: 1200000000, status: 'completed', afterWalletCash: 1200000000, description: 'واریز وجه نقدی به کیف پول' },

  // 2 Transactions for Shaghayeq Shafie (c2)
  { id: 'tx_s1', customerId: 'c2', customerName: 'شقایق شفیع', type: 'buy', date: '1405/06/18', time: '11:00', amountKg: 32.26, ratePerKg: 3100000, totalAmount: 100000000, status: 'completed', afterWalletCash: 0, description: 'خرید مس - فروشنده: شرکت مس واته' },
  { id: 'tx_s2', customerId: 'c2', customerName: 'شقایق شفیع', type: 'deposit', date: '1405/06/18', time: '10:30', totalAmount: 100000000, status: 'completed', afterWalletCash: 100000000, description: 'واریز وجه نقدی به کیف پول' },

  // 5 Transactions for Ali Zafaripour (c3)
  { id: 'tx_z1', customerId: 'c3', customerName: 'علی ظفری پور', type: 'buy', date: '1405/06/14', time: '16:00', amountKg: 105.57, ratePerKg: 2830000, totalAmount: 298755500, status: 'completed', afterWalletCash: 0, description: 'درخواست خرید مس با بودجه ۲۹۸,۷۵۵,۵۰۰ تومان معادل ۱۰۵.۵۷ کیلوگرم' },
  { id: 'tx_z2', customerId: 'c3', customerName: 'علی ظفری پور', type: 'buy', date: '1405/06/14', time: '14:30', amountKg: 31.47, ratePerKg: 2750000, totalAmount: 86542500, status: 'completed', afterWalletCash: 298755500, description: 'درخواست خرید ۳۱.۴۷ کیلوگرم مس با نرخ ۲,۷۵۰,۰۰۰ تومان' },
  { id: 'tx_z3', customerId: 'c3', customerName: 'علی ظفری پور', type: 'sell', date: '1405/06/14', time: '13:00', amountKg: 28.10, ratePerKg: 3080000, totalAmount: 86548000, profitVal: 9273000, status: 'completed', afterWalletCash: 385298000, description: 'درخواست فروش ۲۸.۱۰ کیلوگرم مس با نرخ ۳,۰۸۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_z4', customerId: 'c3', customerName: 'علی ظفری پور', type: 'buy', date: '1405/06/14', time: '11:00', amountKg: 202, ratePerKg: 2750000, totalAmount: 555500000, status: 'completed', afterWalletCash: 298750000, description: 'درخواست خرید ۲۰۲ کیلوگرم مس با نرخ ۲,۷۵۰,۰۰۰ تومان' },
  { id: 'tx_z5', customerId: 'c3', customerName: 'علی ظفری پور', type: 'deposit', date: '1405/06/14', time: '09:30', totalAmount: 854250000, status: 'completed', afterWalletCash: 854250000, description: 'واریز وجه نقدی به کیف پول' },

  // 7 Transactions for Morteza Mohammadi (c4)
  { id: 'tx_m1', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'buy', date: '1405/06/23', time: '10:00', amountKg: 40.12, ratePerKg: 3240000, totalAmount: 130000000, status: 'completed', afterWalletCash: 0, description: 'خرید مس - فروشنده: شرکت مس واته' },
  { id: 'tx_m2', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'deposit', date: '1405/06/20', time: '15:20', totalAmount: 130000000, status: 'completed', afterWalletCash: 130000000, description: 'واریز وجه نقدی به کیف پول' },
  { id: 'tx_m3', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'buy', date: '1405/06/16', time: '12:40', amountKg: 88.57, ratePerKg: 3100000, totalAmount: 274560000, status: 'completed', afterWalletCash: 0, description: 'خرید مس - فروشنده: شرکت مس واته' },
  { id: 'tx_m4', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'deposit', date: '1405/06/16', time: '10:10', totalAmount: 100000000, status: 'completed', afterWalletCash: 274560000, description: 'واریز وجه نقدی به کیف پول' },
  { id: 'tx_m5', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'sell', date: '1405/06/14', time: '17:00', amountKg: 54.55, ratePerKg: 3200000, totalAmount: 174560000, profitVal: 24560000, status: 'completed', afterWalletCash: 174560000, description: 'درخواست فروش ۵۴.۵۵ کیلوگرم مس با نرخ ۳,۲۰۰,۰۰۰ تومان به خریدار بیرونی' },
  { id: 'tx_m6', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'buy', date: '1405/06/14', time: '12:00', amountKg: 54.55, ratePerKg: 2750000, totalAmount: 150000000, status: 'completed', afterWalletCash: 0, description: 'درخواست خرید مس با بودجه ۱۵۰,۰۰۰,۰۰۰ تومان معادل ۵۴.۵۵ کیلوگرم' },
  { id: 'tx_m7', customerId: 'c4', customerName: 'مرتضی محمدی', type: 'deposit', date: '1405/06/14', time: '09:00', totalAmount: 150000000, status: 'completed', afterWalletCash: 150000000, description: 'واریز وجه نقدی به کیف پول' }
];


const getFutureShamsiDate = (days: number): string => getOffsetShamsiDate(days);

const sanitizeDateInput = (val: string): string => {
  if (!val) return '';
  const eng = toEnglishDigits(val);
  return eng.replace(/[^0-9/]/g, '');
};

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
    return saved || '';
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
    return saved ? Number(saved) : 0; // default 0 kg
  });

  // Navigation states
  const [adminSelectedCustomerId, setAdminSelectedCustomerId] = useState<string>('');

  // UI modal states
  const [activeModal, setActiveModal] = useState<'buy' | 'sell' | 'check' | 'deposit' | 'withdraw' | 'add_customer' | 'receipt' | 'adjust_account' | 'company_stock' | 'market_price_settings' | 'change_password' | 'factory_reset' | 'manage_checks' | 'pdf_backup' | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [checkToPass, setCheckToPass] = useState<Transaction | null>(null);
  const [isPassingCheck, setIsPassingCheck] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [checkbookTab, setCheckbookTab] = useState<'pending' | 'cleared'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilterType, setClientFilterType] = useState<'all' | 'copper' | 'cash'>('all');
  const [adminMainTab, setAdminMainTab] = useState<'customers' | 'all_transactions'>('customers');
  const [txSubFilter, setTxSubFilter] = useState<'all' | 'buy' | 'sell' | 'deposit' | 'withdraw' | 'checks'>('all');
  const [txSortOrder, setTxSortOrder] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [txSearchQuery, setTxSearchQuery] = useState('');

  // Action states for the 5 forms
  // 1. Buy copper
  const [buyCustomerId, setBuyCustomerId] = useState('');
  const [buyWeight, setBuyWeight] = useState('');
  const [buyRate, setBuyRate] = useState(buyCopperPrice);
  const [buyResponsible, setBuyResponsible] = useState('حسابدار مس');
  const [buyDesc, setBuyDesc] = useState('');
  const [formError, setFormError] = useState('');

  // 2. Sell copper
  const [sellModel, setSellModel] = useState<'individual' | 'bourse'>('individual');
  const [sellSellerId, setSellSellerId] = useState<string>('');
  const [sellDestination, setSellDestination] = useState<'internal' | 'external'>('internal');
  const [externalBuyerName, setExternalBuyerName] = useState('');
  const [sellPaymentType, setSellPaymentType] = useState<'cash' | 'check'>('cash');
  const [sellCheckNumber, setSellCheckNumber] = useState('');
  const [sellCheckDueDate, setSellCheckDueDate] = useState<string>(() => getFutureShamsiDate(30));
  const [sellCheckBank, setSellCheckBank] = useState('');
  const [sellDate, setSellDate] = useState<string>(() => getTodayShamsi());
  const [sellResponsible, setSellResponsible] = useState('حسابدار مس');
  const [sellWeight, setSellWeight] = useState('');
  const [sellRate, setSellRate] = useState(sellCopperPrice); 
  const [sellPercentage, setSellPercentage] = useState<number | null>(null);
  const [sellDesc, setSellDesc] = useState('');

  // 3. Deposit
  const [depositCustomerId, setDepositCustomerId] = useState('');
  const [depositMethod, setDepositMethod] = useState<'card' | 'bank' | 'pos' | 'cash'>('card');
  const [depositDate, setDepositDate] = useState<string>(() => getTodayShamsi());
  const [depositAmount, setDepositAmount] = useState('');
  const [depositTrackingNum, setDepositTrackingNum] = useState('');
  const [depositBank, setDepositBank] = useState('بانک ملت - حساب جاری شرکت مس و اته');
  const [depositResponsible, setDepositResponsible] = useState('حسابدار مالی / صندوقدار');
  const [depositDesc, setDepositDesc] = useState('');

  // 4. Withdraw
  const [withdrawCustomerId, setWithdrawCustomerId] = useState('');
  const [withdrawDate, setWithdrawDate] = useState<string>(() => getTodayShamsi());
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
  const [adjustDate, setAdjustDate] = useState<string>(() => getTodayShamsi());
  const [adjustTypeMode, setAdjustTypeMode] = useState<'direct' | 'relative'>('direct');
  const [directCashInput, setDirectCashInput] = useState('');
  const [directCopperInput, setDirectCopperInput] = useState('');
  const [adjustCashMode, setAdjustCashMode] = useState<'increase' | 'decrease'>('increase');
  const [adjustCashAmount, setAdjustCashAmount] = useState('');
  const [adjustCopperMode, setAdjustCopperMode] = useState<'increase' | 'decrease'>('increase');
  const [adjustCopperAmount, setAdjustCopperAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // State for deleting customer confirmation
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // State for factory reset & zeroing
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Backup State
  const [lastBackupTime, setLastBackupTime] = useState<number>(() => {
    const saved = localStorage.getItem('vateh_last_backup_time');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sync reference rates when they are modified
  useEffect(() => {
    setBuyRate(buyCopperPrice);
  }, [buyCopperPrice]);

  useEffect(() => {
    setSellRate(sellCopperPrice);
  }, [sellCopperPrice]);

  // Auto-dismiss toast message
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
        if (!custErr && custData && custData.length >= 4 && isMounted) {
          setCustomers(custData.map(mapDbCustomer));
        } else if (isMounted) {
          // Seed Supabase with initial 4 customers if empty or incomplete
          const seedData = INITIAL_CUSTOMERS.map(mapCustomerToDb);
          await supabase.from('customers').upsert(seedData);
          const { data: refreshedCust } = await supabase.from('customers').select('*').order('created_at', { ascending: true });
          if (refreshedCust && refreshedCust.length > 0 && isMounted) {
            setCustomers(refreshedCust.map(mapDbCustomer));
          } else if (isMounted) {
            setCustomers(INITIAL_CUSTOMERS);
          }
        }

        // 2. Fetch Transactions
        const { data: txData, error: txErr } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (!txErr && txData && txData.length >= 30 && isMounted) {
          setTransactions(txData.map(mapDbTransaction));
        } else if (isMounted) {
          // Seed Supabase with all 30 initial transactions if empty or incomplete
          const seedTxs = INITIAL_TRANSACTIONS.map(mapTransactionToDb);
          await supabase.from('transactions').upsert(seedTxs);
          const { data: refreshedTxs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
          if (refreshedTxs && refreshedTxs.length > 0 && isMounted) {
            setTransactions(refreshedTxs.map(mapDbTransaction));
          } else if (isMounted) {
            setTransactions(INITIAL_TRANSACTIONS);
          }
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
        } else if (payload.eventType === 'DELETE') {
          setTransactions(prev => prev.filter(t => t.id !== (payload.old as any).id));
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
  const isInitialSettingsSync = useRef(true);
  useEffect(() => {
    localStorage.setItem('vateh_buy_price_v5', buyCopperPrice.toString());
    localStorage.setItem('vateh_sell_price_v5', sellCopperPrice.toString());
    localStorage.setItem('vateh_company_warehouse_copper_v5', companyWarehouseCopper.toString());
    localStorage.setItem('vateh_admin_password_v5', adminPassword);

    if (isInitialSettingsSync.current) {
      isInitialSettingsSync.current = false;
      return;
    }

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

  // Universal number parser handling Persian commas (٬), Arabic commas (،), standard commas, spaces etc.
  const parseCleanNumber = (str: string | number): number => {
    if (typeof str === 'number') return isNaN(str) ? 0 : str;
    if (!str) return 0;
    const eng = toEnglishDigits(str);
    const normalized = eng.replace(/[٫]/g, '.').replace(/[,٬،]/g, '');
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Human-readable Persian formats
  const formatNumber = (num: number) => {
    if (isNaN(num) || num === undefined || num === null) return '۰';
    return new Intl.NumberFormat('fa-IR').format(Math.round(num));
  };

  const formatKg = (num: number) => {
    if (isNaN(num) || num === undefined || num === null) return '۰';
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
    const defaultCustId = currentUser?.role === 'customer' 
      ? currentUser.id 
      : (adminSelectedCustomerId || customers[0]?.id || '');

    setFormError('');

    if (type === 'buy') {
      setBuyCustomerId(defaultCustId);
      setBuyWeight('');
      setBuyRate(buyCopperPrice);
      setBuyResponsible('حسابدار مس');
      setBuyDesc('خرید لوله مسی - فروشنده: انبار شرکت مس و اته');
    } else if (type === 'sell') {
      setSellModel('individual');
      setSellSellerId(defaultCustId);
      setSellDestination('internal');
      setExternalBuyerName('');
      setSellPaymentType('cash');
      setSellCheckNumber('');
      setSellCheckDueDate(getFutureShamsiDate(30));
      setSellCheckBank('');
      setSellDate(getTodayShamsi());
      setSellResponsible('حسابدار مس');
      setSellWeight('');
      setSellPercentage(null);
      setSellRate(sellCopperPrice);
      setSellDesc('');
    } else if (type === 'deposit') {
      setDepositCustomerId(defaultCustId);
      setDepositMethod('card');
      setDepositDate(getTodayShamsi());
      setDepositAmount('');
      setDepositTrackingNum('');
      setDepositBank('بانک ملت - حساب جاری شرکت مس و اته');
      setDepositResponsible('حسابدار مالی / صندوقدار');
      setDepositDesc('');
    } else if (type === 'withdraw') {
      setWithdrawCustomerId(defaultCustId);
      setWithdrawDate(getTodayShamsi());
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
    setFormError('');

    const activeId = currentUser?.role === 'customer' 
      ? currentUser.id 
      : (buyCustomerId || adminSelectedCustomerId || customers[0]?.id);

    const client = customers.find(c => c.id === activeId);
    if (!client) {
      setFormError('حساب مشتری مورد نظر برای ثبت خرید یافت نشد.');
      return;
    }

    const kg = parseCleanNumber(buyWeight);
    if (kg <= 0) {
      setFormError('لطفاً وزن معتبر برای خرید مس وارد کنید.');
      return;
    }

    if (buyRate <= 0) {
      setFormError('لطفاً قیمت هر کیلوگرم مس را وارد کنید.');
      return;
    }

    const totalCost = kg * buyRate;

    const currentWallet = Number(client.walletCash) || 0;
    const currentCopper = Number(client.copperBalance) || 0;
    const currentAvg = Number(client.averageBuyPrice) || buyRate;

    const newWeight = currentCopper + kg;
    const totalOldCost = currentCopper * currentAvg;
    const totalNewCost = kg * buyRate;
    const newAvg = (totalOldCost + totalNewCost) / (newWeight || 1);
    const afterCash = currentWallet - totalCost;

    const updatedCustomers = customers.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          walletCash: afterCash,
          copperBalance: newWeight,
          averageBuyPrice: isNaN(newAvg) ? buyRate : newAvg
        };
      }
      return c;
    });

    const totalCopper = updatedCustomers.reduce((acc, c) => acc + (Number(c.copperBalance) || 0), 0);
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
      description: `خرید لوله مسی (${formatKg(kg)} ک‌گ با نرخ ${formatNumber(buyRate)} ت)`,
      afterWalletCash: afterCash
    };

    const nextTransactions = [newTx, ...transactions];

    // Immediate storage persistence
    localStorage.setItem('vateh_customers_v5', JSON.stringify(finalized));
    localStorage.setItem('vateh_transactions_v5', JSON.stringify(nextTransactions));

    setCompanyWarehouseCopper(prev => Math.max(0, prev - kg));
    setCustomers(finalized);
    setTransactions(nextTransactions);
    setActiveModal(null);
  };

  // SELL copper transaction
  const submitSellCopper = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const kg = parseCleanNumber(sellWeight);
    if (kg <= 0) {
      setFormError('لطفاً مقدار معتبر برای وزن مس وارد کنید.');
      return;
    }

    if (sellRate <= 0) {
      setFormError('لطفاً قیمت فروش هر کیلوگرم را وارد کنید.');
      return;
    }

    const isCheckPayment = sellPaymentType === 'check';
    const cleanCheckNum = sellCheckNumber.trim();

    if (isCheckPayment && !cleanCheckNum) {
      setFormError('لطفاً شناسه یا شماره چک صیادی را وارد نمایید.');
      return;
    }

    const txDate = sellDate || getTodayShamsi();
    const txTime = new Date().toLocaleTimeString('fa-IR');

    if (sellModel === 'individual') {
      const selectedId = currentUser?.role === 'customer' 
        ? currentUser.id 
        : (sellSellerId || adminSelectedCustomerId || customers[0]?.id);
      const client = customers.find(c => c.id === selectedId);
      if (!client) {
        setFormError('لطفاً طرف حساب فروشنده را انتخاب کنید.');
        return;
      }

      if (client.copperBalance < kg) {
        setFormError(`موجودی لوله مسی مشتری کافی نیست. موجودی فعلی: ${formatKg(client.copperBalance)} کیلوگرم می‌باشد.`);
        return;
      }

      const totalRevenue = kg * sellRate;
      const profit = (sellRate - client.averageBuyPrice) * kg;

      // Rule: If check, walletCash does NOT change until check clears. inTransitChecks increases.
      // If cash, walletCash increases by totalRevenue.
      const updatedCustomers = customers.map(c => {
        if (c.id === client.id) {
          const newWallet = isCheckPayment ? c.walletCash : c.walletCash + totalRevenue;
          const newChecks = isCheckPayment ? c.inTransitChecks + totalRevenue : c.inTransitChecks;
          const newBlocked = isCheckPayment ? c.blockedCopper + 1 : c.blockedCopper;

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
        ? 'فروش داخلی (تحویل به انبار شرکت مس و اته)' 
        : `فروش به خارج (خریدار بیرونی: ${externalBuyerName.trim() || 'نامشخص'})`;
      
      if (isCheckPayment) {
        desc += ` | 💳 دریافت چک صیاد: ${cleanCheckNum} (سررسید: ${sellCheckDueDate})${sellCheckBank ? ` - بانک ${sellCheckBank}` : ''} [در انتظار وصول]`;
      } else {
        desc += ' | 💵 تسویه نقدی به کیف پول';
      }

      if (sellResponsible) {
        desc += ` | مسئول: ${sellResponsible}`;
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
        status: isCheckPayment ? 'pending' : 'completed',
        description: desc,
        checkNumber: isCheckPayment ? cleanCheckNum : undefined,
        afterWalletCash: isCheckPayment ? client.walletCash : client.walletCash + totalRevenue,
        profitVal: profit > 0 ? profit : undefined
      };

      if (sellDestination === 'internal') {
        setCompanyWarehouseCopper(prev => prev + kg);
      }

      const nextTransactions = [newTx, ...transactions];
      localStorage.setItem('vateh_customers_v5', JSON.stringify(finalized));
      localStorage.setItem('vateh_transactions_v5', JSON.stringify(nextTransactions));

      setCustomers(finalized);
      setTransactions(nextTransactions);
      setActiveModal(null);

      // Immediate Supabase sync
      supabase.from('customers').upsert(finalized.map(mapCustomerToDb)).then();
      supabase.from('transactions').insert([mapTransactionToDb(newTx)]).then();

      if (isCheckPayment) {
        setToastMessage({
          title: 'ثبت فاکتور فروش چکی',
          desc: `فروش مس با چک صیادی به شماره ${cleanCheckNum} به مبلغ ${formatNumber(totalRevenue)} تومان ثبت گردید. وجه در «اسناد درراه» قرار گرفت و طبق اصول حسابداری تا زمان وصول، موجودی نقدی تغییر نمی‌کند. هر زمان چک پاس شد، می‌توانید از منوی چک‌ها یا جدول، دکمه «تیک پاس شدن» را بزنید.`,
          type: 'info'
        });
      } else {
        setToastMessage({
          title: 'ثبت فاکتور فروش نقدی',
          desc: `فروش مس به مبلغ ${formatNumber(totalRevenue)} تومان با موفقیت ثبت و به موجودی نقدی کیف پول واریز گردید.`,
          type: 'success'
        });
      }
    } else {
      // Bourse / Proportionate sell across all shareholders
      if (totalCopperPool < kg) {
        setFormError(`مجموع مس انبار شرکت (${formatKg(totalCopperPool)} کیلوگرم) کمتر از مقدار درخواستی فروش است.`);
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

        const newWallet = isCheckPayment ? c.walletCash : c.walletCash + custRev;
        const newChecks = isCheckPayment ? c.inTransitChecks + custRev : c.inTransitChecks;
        const newBlocked = isCheckPayment ? c.blockedCopper + 1 : c.blockedCopper;

        let desc = `فروش بورسی (سهم متناسب ${c.sharePercentage.toFixed(1)}٪)`;
        desc += sellDestination === 'internal' 
          ? ' - تحویل به شرکت' 
          : ` - خریدار بیرونی: ${externalBuyerName.trim() || 'نامشخص'}`;
        
        if (isCheckPayment) {
          desc += ` | 💳 دریافت چک صیاد: ${cleanCheckNum} (سررسید: ${sellCheckDueDate}) [در انتظار وصول]`;
        } else {
          desc += ' | 💵 تسویه نقدی به کیف پول';
        }

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
          status: isCheckPayment ? 'pending' : 'completed',
          description: desc,
          checkNumber: isCheckPayment ? cleanCheckNum : undefined,
          afterWalletCash: isCheckPayment ? c.walletCash : newWallet,
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

      const nextTransactions = [...newTxs, ...transactions];
      localStorage.setItem('vateh_customers_v5', JSON.stringify(finalized));
      localStorage.setItem('vateh_transactions_v5', JSON.stringify(nextTransactions));

      setCustomers(finalized);
      setTransactions(nextTransactions);
      setActiveModal(null);

      // Immediate Supabase sync
      supabase.from('customers').upsert(finalized.map(mapCustomerToDb)).then();
      supabase.from('transactions').insert(newTxs.map(mapTransactionToDb)).then();

      if (isCheckPayment) {
        setToastMessage({
          title: 'ثبت فروش بورسی با چک',
          desc: `فروش بورسی مس با چک صیادی ${cleanCheckNum} به مبلغ ${formatNumber(totalRevenue)} تومان ثبت و در اسناد درراه سهامداران قرار گرفت.`,
          type: 'info'
        });
      } else {
        setToastMessage({
          title: 'ثبت فروش بورسی نقدی',
          desc: `فروش بورسی مس با تسویه نقدی به مبلغ ${formatNumber(totalRevenue)} تومان با موفقیت ثبت گردید.`,
          type: 'success'
        });
      }
    }
  };

  // Pass / Clear Check (وصول چک صیادی و واریز به کیف پول)
  const handlePassCheck = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx || tx.status === 'completed') return;

    const targetCust = customers.find(c => c.id === tx.customerId);
    if (!targetCust) return;

    setIsPassingCheck(true);

    const checkAmount = tx.totalAmount;
    const newWalletCash = targetCust.walletCash + checkAmount;
    const newInTransitChecks = Math.max(0, targetCust.inTransitChecks - checkAmount);
    const newBlockedCopper = Math.max(0, targetCust.blockedCopper - 1);

    const clearedDesc = tx.description 
      ? `${tx.description} | ✅ چک صیاد وصول شد و به کیف پول واریز گردید (${getTodayShamsi()})`
      : `✅ وصول چک صیادی (${getTodayShamsi()})`;

    const updatedCustomers = customers.map(c => {
      if (c.id === targetCust.id) {
        return {
          ...c,
          walletCash: newWalletCash,
          inTransitChecks: newInTransitChecks,
          blockedCopper: newBlockedCopper
        };
      }
      return c;
    });

    const updatedTransactions = transactions.map(t => {
      if (t.id === txId) {
        return {
          ...t,
          status: 'completed' as const,
          afterWalletCash: newWalletCash,
          description: clearedDesc
        };
      }
      return t;
    });

    localStorage.setItem('vateh_customers_v5', JSON.stringify(updatedCustomers));
    localStorage.setItem('vateh_transactions_v5', JSON.stringify(updatedTransactions));

    setCustomers(updatedCustomers);
    setTransactions(updatedTransactions);
    setCheckToPass(null);
    setIsPassingCheck(false);

    // Sync to Supabase immediately
    try {
      await supabase.from('customers').update({
        wallet_cash: newWalletCash,
        in_transit_checks: newInTransitChecks,
        blocked_copper: newBlockedCopper
      }).eq('id', targetCust.id);

      await supabase.from('transactions').update({
        status: 'completed',
        after_wallet_cash: newWalletCash,
        description: clearedDesc
      }).eq('id', txId);
    } catch (err) {
      console.error('Error syncing passed check to Supabase:', err);
    }

    setToastMessage({
      title: 'وصول موفق چک صیادی',
      desc: `چک صیادی شماره ${tx.checkNumber || ''} به مبلغ ${formatNumber(checkAmount)} تومان با موفقیت پاس شد و به موجودی نقدی «${targetCust.name}» اضافه گردید.`,
      type: 'success'
    });
  };

  // DEPOSIT transaction
  const submitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = currentUser?.role === 'customer' 
      ? currentUser.id 
      : (depositCustomerId || adminSelectedCustomerId || customers[0]?.id);
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    const amount = parseCleanNumber(depositAmount);
    if (amount <= 0) {
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

    setTransactions(prev => [newTx, ...prev]);
    setActiveModal(null);
  };

  // WITHDRAW transaction
  const submitWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = currentUser?.role === 'customer' 
      ? currentUser.id 
      : (withdrawCustomerId || adminSelectedCustomerId || customers[0]?.id);
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    const amount = parseCleanNumber(withdrawAmount);
    if (amount <= 0) {
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

    setTransactions(prev => [newTx, ...prev]);
    setActiveModal(null);
  };

  // REGISTER CHECK transaction
  const submitRegisterCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const client = customers.find(c => c.id === adminSelectedCustomerId);
    if (!client) return;

    const amountVal = parseFloat(toEnglishDigits(checkAmount.replace(/,/g, '')));
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('لطفاً مبلغ معتبر برای چک صیادی وارد کنید.');
      return;
    }

    const updated = customers.map(c => {
      if (c.id === client.id) {
        return {
          ...c,
          inTransitChecks: c.inTransitChecks + amountVal,
          blockedCopper: c.blockedCopper + 1
        };
      }
      return c;
    });

    const newTx: Transaction = {
      id: 'tx_' + Date.now(),
      customerId: client.id,
      customerName: client.name,
      type: 'check_register',
      date: getTodayShamsi(),
      time: new Date().toLocaleTimeString('fa-IR'),
      totalAmount: amountVal,
      status: 'pending',
      description: checkDesc || 'سند اسناد درراه - ۱ چک مسدود لوله مسی',
      checkNumber: checkNum || 'ثبت نشده',
      afterWalletCash: client.walletCash
    };

    const nextTxs = [newTx, ...transactions];
    localStorage.setItem('vateh_customers_v5', JSON.stringify(updated));
    localStorage.setItem('vateh_transactions_v5', JSON.stringify(nextTxs));

    setCustomers(updated);
    setTransactions(nextTxs);
    setActiveModal(null);

    // Immediate Supabase sync
    supabase.from('customers').upsert(updated.map(mapCustomerToDb)).then();
    supabase.from('transactions').insert([mapTransactionToDb(newTx)]).then();

    setToastMessage({
      title: 'ثبت چک صیادی در اسناد درراه',
      desc: `چک صیادی به شماره ${checkNum || ''} به مبلغ ${formatNumber(amountVal)} تومان ثبت گردید. وجه در «اسناد درراه» قرار گرفت و تا زمان وصول، موجودی نقدی اضافه نمی‌شود.`,
      type: 'info'
    });
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

  // Helper to open direct balance editor modal
  const openDirectBalanceModal = (targetCustId?: string) => {
    const selectedId = targetCustId || adminSelectedCustomerId || customers[0]?.id || '';
    setAdjustCustomerId(selectedId);
    setAdjustDate(getTodayShamsi());
    setAdjustTypeMode('direct');

    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (client) {
      setDirectCashInput(formatNumber(client.walletCash));
      setDirectCopperInput(client.copperBalance.toString());
    } else {
      setDirectCashInput('۰');
      setDirectCopperInput('۰');
    }

    setAdjustCashMode('increase');
    setAdjustCashAmount('');
    setAdjustCopperMode('increase');
    setAdjustCopperAmount('');
    setAdjustReason('تنظیم مستقیم و دستی موجودی‌ها توسط مدیر سیستم');
    setFormError('');
    setActiveModal('adjust_account');
  };

  // Submit Adjustment / Direct Balance Edit
  const submitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedId = adjustCustomerId || adminSelectedCustomerId;
    const client = customers.find(c => c.id === selectedId) || customers[0];
    if (!client) {
      alert('لطفاً طرف حساب را انتخاب کنید.');
      return;
    }

    const txDate = adjustDate || getTodayShamsi();
    let finalized: Customer[] = [];
    let newTx: Transaction;

    if (adjustTypeMode === 'direct') {
      const targetCash = parseCleanNumber(directCashInput);
      const targetCopper = parseCleanNumber(directCopperInput);

      const updatedCustomers = customers.map(c => {
        if (c.id === client.id) {
          return {
            ...c,
            walletCash: targetCash,
            copperBalance: targetCopper,
          };
        }
        return c;
      });

      const totalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
      finalized = updatedCustomers.map(c => ({
        ...c,
        sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
      }));

      newTx = {
        id: 'tx_' + Date.now(),
        customerId: client.id,
        customerName: client.name,
        type: 'adjustment',
        date: txDate,
        time: new Date().toLocaleTimeString('fa-IR'),
        amountKg: targetCopper,
        totalAmount: targetCash,
        status: 'completed',
        description: `تنظیم مستقیم موجودی توسط مدیریت - ${adjustReason.trim() || 'ویرایش دستی موجودی‌ها'}`,
        afterWalletCash: targetCash
      };

      setToastMessage({
        title: 'ویرایش مستقیم موجودی با موفقیت انجام شد',
        desc: `موجودی نقدی «${client.name}» برابر با ${formatNumber(targetCash)} تومان و موجودی لوله مسی برابر با ${formatKg(targetCopper)} کیلوگرم ثبت و در دیتابیس سینک شد.`,
        type: 'success'
      });
    } else {
      // Relative adjustment (+ / - deltas)
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
      finalized = updatedCustomers.map(c => ({
        ...c,
        sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
      }));

      const newCash = Math.max(0, client.walletCash + cashAdjustVal);

      newTx = {
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
        afterWalletCash: newCash
      };

      setToastMessage({
        title: 'ثبت سند اصلاح حساب',
        desc: `تعدیل موجودی حساب «${client.name}» با موفقیت اعمال و در دیتابیس ثبت گردید.`,
        type: 'success'
      });
    }

    const nextTxs = [newTx, ...transactions];
    localStorage.setItem('vateh_customers_v5', JSON.stringify(finalized));
    localStorage.setItem('vateh_transactions_v5', JSON.stringify(nextTxs));

    setCustomers(finalized);
    setTransactions(nextTxs);

    // Sync to Supabase
    supabase.from('customers').upsert(finalized.map(mapCustomerToDb)).then();
    supabase.from('transactions').insert([mapTransactionToDb(newTx)]).then();

    setAdjustCashAmount('');
    setAdjustCopperAmount('');
    setAdjustReason('');
    setActiveModal(null);
  };

  // Confirm Delete Customer profile with full Supabase & LocalStorage sync
  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    const { id } = customerToDelete;
    setIsDeletingCustomer(true);

    try {
      // 1. Direct Supabase delete
      await supabase.from('transactions').delete().eq('customer_id', id);
      await supabase.from('customers').delete().eq('id', id);

      // 2. Local state update
      const updatedCustomers = customers.filter(c => c.id !== id);
      const totalCopper = updatedCustomers.reduce((acc, c) => acc + c.copperBalance, 0);
      const finalized = updatedCustomers.map(c => ({
        ...c,
        sharePercentage: totalCopper > 0 ? (c.copperBalance / totalCopper) * 100 : 0
      }));

      setCustomers(finalized);
      setTransactions(prev => prev.filter(t => t.customerId !== id));
      localStorage.setItem('vateh_customers_v5', JSON.stringify(finalized));
      localStorage.setItem('vateh_transactions_v5', JSON.stringify(transactions.filter(t => t.customerId !== id)));

      if (adminSelectedCustomerId === id) {
        setAdminSelectedCustomerId('');
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
    } finally {
      setIsDeletingCustomer(false);
      setCustomerToDelete(null);
    }
  };

  // Load official PDF backup data (4 customers, 30 transactions) into state, localStorage, and Supabase
  const handleLoadOfficialPdfBackupData = async () => {
    setIsResetting(true);
    try {
      localStorage.setItem('vateh_customers_v5', JSON.stringify(INITIAL_CUSTOMERS));
      localStorage.setItem('vateh_transactions_v5', JSON.stringify(INITIAL_TRANSACTIONS));
      setCustomers(INITIAL_CUSTOMERS);
      setTransactions(INITIAL_TRANSACTIONS);

      // Sync to Supabase
      await supabase.from('customers').upsert(INITIAL_CUSTOMERS.map(mapCustomerToDb));
      await supabase.from('transactions').upsert(INITIAL_TRANSACTIONS.map(mapTransactionToDb));

      setToastMessage({
        title: 'بارگذاری کامل بک‌آپ ۳۰ سند مالی',
        desc: 'اطلاعات کامل ۴ حساب و ۳۰ تراکنش شهریور ۱۴۰۵ با موفقیت در دیتابیس آنلاین جایگذاری و سینک گردید.',
        type: 'success'
      });
      setResetSuccessMessage('اطلاعات کامل ۴ حساب و ۳۰ سند مالی با موفقیت روی سیستم و دیتابیس Supabase بارگذاری شد.');
    } catch (err) {
      console.error('Error loading backup data:', err);
      alert('خطا در بارگذاری اطلاعات روی دیتابیس.');
    } finally {
      setIsResetting(false);
    }
  };

  // Open Standalone Print/PDF Export Window
  const handleOpenPdfPrintWindow = () => {
    const totalWalletCash = customers.reduce((sum, c) => sum + (c.walletCash || 0), 0);
    const pendingChecksList = transactions.filter(t => t.status === 'pending' && (t.checkNumber || t.type === 'check_register'));
    const pendingChecksTotalAmount = pendingChecksList.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const filename = `vateh-weekly-backup-${getTodayShamsi().replace(/\//g, '-')}`;

    const reportHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>گزارش و بک‌آپ هفتگی سامانه معاملات مس واته - ${getTodayShamsi()}</title>
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body {
            font-family: 'Vazirmatn', sans-serif;
            background: #ffffff;
            color: #0f172a;
            direction: rtl;
            padding: 20px;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            background: #0f172a;
            color: white;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
          }
          .no-print button {
            background: #059669;
            color: white;
            border: none;
            padding: 10px 24px;
            font-family: 'Vazirmatn', sans-serif;
            font-weight: 900;
            font-size: 14px;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          .no-print button:hover { background: #047857; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: right; }
          th { background-color: #f1f5f9; font-weight: bold; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0 20px 0; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">
            🖨️ چاپ / ذخیره به عنوان فایل PDF (Print / Save as PDF)
          </button>
          <div style="font-size: 11px; margin-top: 8px; opacity: 0.85;">
            راهنما: در پنجره بازشده مرورگر، بخش <strong>Destination (مقصد)</strong> را روی گزینه <strong>Save as PDF (ذخیره به عنوان PDF)</strong> قرار دهید.
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">گزارش و بک‌آپ هفتگی سامانه معاملات مس واته</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #b45309;">پلتفرم رسمی مدیریت معاملات لوله مسی و اسناد صیادی</p>
          </div>
          <div style="text-align: left; font-size: 11px; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div><strong>تاریخ بک‌آپ:</strong> ${getTodayShamsi()}</div>
            <div><strong>روز هفته:</strong> ${getPersianDayOfWeek(getTodayShamsi())}</div>
            <div><strong>زمان ثبت:</strong> ${new Date().toLocaleTimeString('fa-IR')}</div>
            <div><strong>صادرکننده:</strong> ${currentUser?.name || 'مدیریت'}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card" style="background: #fffbeb; border-color: #fde68a;">
            <div style="font-size: 10px; font-weight: 700; color: #92400e;">موجودی کیف پول:</div>
            <div style="font-size: 13px; font-weight: 900; color: #78350f; margin-top: 4px;">${formatNumber(totalWalletCash)} تومان</div>
          </div>
          <div class="card" style="background: #fff7ed; border-color: #fed7aa;">
            <div style="font-size: 10px; font-weight: 700; color: #9a3412;">موجودی انبار مس:</div>
            <div style="font-size: 13px; font-weight: 900; color: #7c2d12; margin-top: 4px;">${formatKg(companyWarehouseCopper)} کیلوگرم</div>
          </div>
          <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
            <div style="font-size: 10px; font-weight: 700; color: #1e40af;">چک‌های معوق:</div>
            <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; margin-top: 4px;">${formatNumber(pendingChecksTotalAmount)} تومان</div>
          </div>
          <div class="card">
            <div style="font-size: 10px; font-weight: 700; color: #475569;">تعداد حساب‌ها:</div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 4px;">${customers.length} طرف حساب</div>
          </div>
        </div>

        <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #f59e0b; padding-right: 8px; margin: 15px 0 8px 0;">۱. دفتر کل تراز حساب‌ها و موجودی مشتریان</h2>
        <table>
          <thead>
            <tr>
              <th>نام مشتری</th>
              <th>شماره تماس</th>
              <th style="text-align: center;">موجودی ریالی (تومان)</th>
              <th style="text-align: center;">موجودی مس (کیلوگرم)</th>
              <th style="text-align: center;">اسناد درراه</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td style="font-weight: 700;">${c.name}</td>
                <td>${c.mobile || '-'}</td>
                <td style="text-align: center; font-weight: 900; color: #047857;">${formatNumber(c.walletCash)}</td>
                <td style="text-align: center; font-weight: 700; color: #c2410c;">${formatKg(c.copperBalance)}</td>
                <td style="text-align: center;">${c.inTransitChecks ? formatNumber(c.inTransitChecks) + ' ت' : 'بدون چک'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${pendingChecksList.length > 0 ? `
          <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #2563eb; padding-right: 8px; margin: 15px 0 8px 0;">۲. چک‌های صیادی و اسناد درراه</h2>
          <table>
            <thead>
              <tr style="background: #eff6ff;">
                <th>شناسه صیادی</th>
                <th>مشتری</th>
                <th style="text-align: center;">مبلغ (تومان)</th>
                <th style="text-align: center;">روز و تاریخ ثبت</th>
                <th>شرح</th>
              </tr>
            </thead>
            <tbody>
              ${pendingChecksList.map(ch => `
                <tr>
                  <td style="font-weight: 700; color: #1e40af;">${ch.checkNumber || '-'}</td>
                  <td>${ch.customerName}</td>
                  <td style="text-align: center; font-weight: 900;">${formatNumber(ch.totalAmount)}</td>
                  <td style="text-align: center;"><strong style="color:#b45309;">${getPersianDayOfWeek(ch.date)}</strong> ${ch.date}</td>
                  <td>${ch.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #059669; padding-right: 8px; margin: 20px 0 10px 0;">۳. دفتر ریز تراکنش‌ها و ریز اسناد مالی اشخاص</h2>
        ${customers.map(cust => {
          const custTxs = transactions.filter(t => t.customerId === cust.id);
          if (custTxs.length === 0) return '';

          return `
            <div style="margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <div style="background: #f1f5f9; padding: 6px 12px; font-weight: 900; font-size: 11px; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
                <span>طرف حساب: <strong>${cust.name}</strong> (${cust.mobile || '-'})</span>
                <span>تعداد سوابق: ${custTxs.length} فقره</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 0;">
                <thead>
                  <tr style="background: #fafafa;">
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 20%;">روز هفته / تاریخ و زمان</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 15%;">نوع معامله</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 12%;">وزن مس (kg)</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 15%;">مبلغ کل (تومان)</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 15%;">کیف پول بعد معامله</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 23%;">شرح و شناسه سند</th>
                  </tr>
                </thead>
                <tbody>
                  ${custTxs.map(tx => `
                    <tr>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">
                        <strong style="color: #b45309; display: block; font-size: 10px;">${getPersianDayOfWeek(tx.date)}</strong>
                        <span>${tx.date}</span>
                        ${tx.time ? `<br/><span style="color:#64748b; font-size: 9px;">ساعت ${tx.time}</span>` : ''}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">
                        ${tx.type === 'buy' ? 'خرید لوله مسی' :
                          tx.type === 'sell' ? 'فروش لوله مسی' :
                          tx.type === 'deposit' ? 'شارژ کیف پول' :
                          tx.type === 'withdraw' ? 'تسویه/برداشت' :
                          tx.type === 'check_register' ? 'ثبت چک صیادی' :
                          'اصلاح حساب'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #c2410c;">
                        ${tx.amountKg ? formatKg(tx.amountKg) : '-'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 900; color: #0f172a;">
                        ${formatNumber(tx.totalAmount)}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #047857;">
                        ${tx.afterWalletCash !== undefined ? formatNumber(tx.afterWalletCash) + ' ت' : '-'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 10px;">
                        ${tx.description || '-'}
                        ${tx.checkNumber ? `<br/><strong style="color: #1e40af;">[صیادی: ${tx.checkNumber}]</strong>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; text-align: center; font-size: 11px;">
          <div>
            <strong>امضا و مهر حسابداری:</strong>
            <div style="height: 40px;"></div>
          </div>
          <div>
            <strong>امضا و مهر مدیریت (واته):</strong>
            <div style="height: 40px;"></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      setTimeout(() => {
        try { printWindow.print(); } catch (e) {}
      }, 400);
    } else {
      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.html`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.print();
    }
  };

  // Download PDF Backup file using standalone clean inline-styled HTML container
  const handleDownloadPdfBackup = async () => {
    const nowTs = Date.now();
    localStorage.setItem('vateh_last_backup_time', nowTs.toString());
    setLastBackupTime(nowTs);

    const totalWalletCash = customers.reduce((sum, c) => sum + (c.walletCash || 0), 0);
    const pendingChecksList = transactions.filter(t => t.status === 'pending' && (t.checkNumber || t.type === 'check_register'));
    const pendingChecksTotalAmount = pendingChecksList.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    // Create temporary offscreen element with pure inline hex styles (prevents html2canvas CSS parsing errors)
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '790px';
    container.style.padding = '20px';
    container.style.background = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = "'Vazirmatn', 'Vazir', sans-serif";
    container.style.direction = 'rtl';

    container.innerHTML = `
      <div style="font-family: 'Vazirmatn', sans-serif; padding: 15px; background: #ffffff; color: #0f172a; direction: rtl; font-size: 12px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 15px;">
          <div>
            <h1 style="margin: 0; font-size: 18px; font-weight: 900; color: #0f172a;">گزارش و بک‌آپ هفتگی سامانه معاملات مس واته</h1>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 700; color: #b45309;">پلتفرم رسمی مدیریت معاملات لوله مسی و اسناد صیادی</p>
          </div>
          <div style="text-align: left; font-size: 11px; font-family: sans-serif; background: #f8fafc; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div><strong>تاریخ بک‌آپ:</strong> ${getTodayShamsi()}</div>
            <div><strong>زمان ثبت:</strong> ${new Date().toLocaleTimeString('fa-IR')}</div>
            <div><strong>صادرکننده:</strong> ${currentUser?.name || 'مدیریت'}</div>
          </div>
        </div>

        <!-- Metric Summary Cards -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #92400e;">موجودی کیف پول:</div>
            <div style="font-size: 13px; font-weight: 900; color: #78350f; margin-top: 4px;">${formatNumber(totalWalletCash)} تومان</div>
          </div>
          <div style="background: #fff7ed; border: 1px solid #fed7aa; padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #9a3412;">موجودی انبار مس:</div>
            <div style="font-size: 13px; font-weight: 900; color: #7c2d12; margin-top: 4px;">${formatKg(companyWarehouseCopper)} کیلوگرم</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #1e40af;">چک‌های معوق:</div>
            <div style="font-size: 13px; font-weight: 900; color: #1e3a8a; margin-top: 4px;">${formatNumber(pendingChecksTotalAmount)} تومان</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px;">
            <div style="font-size: 10px; font-weight: 700; color: #475569;">تعداد حساب‌ها:</div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 4px;">${customers.length} طرف حساب</div>
          </div>
        </div>

        <!-- Customers Table -->
        <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #f59e0b; padding-right: 8px; margin: 15px 0 8px 0;">۱. دفتر کل تراز حساب‌ها و موجودی مشتریان</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: right;">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">نام مشتری</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">شماره تماس</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">موجودی ریالی (تومان)</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">موجودی مس (کیلوگرم)</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">اسناد درراه</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700;">${c.name}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${c.mobile || '-'}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 900; color: #047857;">${formatNumber(c.walletCash)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700; color: #c2410c;">${formatKg(c.copperBalance)}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${c.inTransitChecks ? formatNumber(c.inTransitChecks) + ' ت' : 'بدون چک'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${pendingChecksList.length > 0 ? `
          <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #2563eb; padding-right: 8px; margin: 15px 0 8px 0;">۲. چک‌های صیادی و اسناد درراه</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #eff6ff; text-align: right;">
                <th style="padding: 8px; border: 1px solid #cbd5e1;">شناسه صیادی</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">مشتری</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">مبلغ (تومان)</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">تاریخ ثبت</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1;">شرح</th>
              </tr>
            </thead>
            <tbody>
              ${pendingChecksList.map(ch => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 700; color: #1e40af;">${ch.checkNumber || '-'}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1;">${ch.customerName}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: 900;">${formatNumber(ch.totalAmount)}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${ch.date}</td>
                  <td style="padding: 8px; border: 1px solid #cbd5e1;">${ch.description || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <h2 style="font-size: 12px; font-weight: 900; border-right: 4px solid #059669; padding-right: 8px; margin: 20px 0 10px 0;">۳. دفتر ریز تراکنش‌ها و ریز اسناد مالی اشخاص</h2>
        ${customers.map(cust => {
          const custTxs = transactions.filter(t => t.customerId === cust.id);
          if (custTxs.length === 0) return '';

          return `
            <div style="margin-bottom: 15px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <div style="background: #f1f5f9; padding: 6px 12px; font-weight: 900; font-size: 11px; color: #0f172a; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between;">
                <span>طرف حساب: <strong>${cust.name}</strong> (${cust.mobile || '-'})</span>
                <span>تعداد سوابق: ${custTxs.length} فقره</span>
              </div>
              <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 0;">
                <thead>
                  <tr style="background: #fafafa;">
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 15%;">تاریخ و زمان</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 15%;">نوع معامله</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 12%;">وزن مس (kg)</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 15%;">مبلغ کل (تومان)</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; text-align: center; width: 15%;">کیف پول بعد معامله</th>
                    <th style="padding: 6px; border-bottom: 1px solid #cbd5e1; width: 28%;">شرح و شناسه سند</th>
                  </tr>
                </thead>
                <tbody>
                  ${custTxs.map(tx => `
                    <tr>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${tx.date} ${tx.time ? `<br/><span style="color:#64748b; font-size: 9px;">${tx.time}</span>` : ''}</td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-weight: 700;">
                        ${tx.type === 'buy' ? 'خرید لوله مسی' :
                          tx.type === 'sell' ? 'فروش لوله مسی' :
                          tx.type === 'deposit' ? 'شارژ کیف پول' :
                          tx.type === 'withdraw' ? 'تسویه/برداشت' :
                          tx.type === 'check_register' ? 'ثبت چک صیادی' :
                          'اصلاح حساب'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #c2410c;">
                        ${tx.amountKg ? formatKg(tx.amountKg) : '-'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 900; color: #0f172a;">
                        ${formatNumber(tx.totalAmount)}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 700; color: #047857;">
                        ${tx.afterWalletCash !== undefined ? formatNumber(tx.afterWalletCash) + ' ت' : '-'}
                      </td>
                      <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 10px;">
                        ${tx.description || '-'}
                        ${tx.checkNumber ? `<br/><strong style="color: #1e40af;">[صیادی: ${tx.checkNumber}]</strong>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #cbd5e1; display: grid; grid-template-columns: 1fr 1fr; text-align: center; font-size: 11px;">
          <div>
            <strong>امضا و مهر حسابداری:</strong>
            <div style="height: 40px;"></div>
          </div>
          <div>
            <strong>امضا و مهر مدیریت (واته):</strong>
            <div style="height: 40px;"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const filename = `vateh-weekly-backup-${getTodayShamsi().replace(/\//g, '-')}.pdf`;

    try {
      // @ts-ignore
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: 6,
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(container).save();

      setToastMessage({
        title: 'دانلود موفق بک‌آپ PDF',
        desc: `فایل پشتیبان هفتگی «${filename}» با موفقیت ایجاد و دانلود شد.`,
        type: 'success'
      });
    } catch (err) {
      console.error('PDF export fallback:', err);
      // Fallback Blob download
      const blob = new Blob([`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"/><title>${filename}</title><style>@import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap'); body { font-family: 'Vazirmatn', sans-serif; padding: 20px; }</style></head><body>${container.innerHTML}</body></html>`], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename.replace('.pdf', '.html');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.print();
    } finally {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  };

  // Factory reset & zero all balances in state, localStorage, and Supabase
  const handleFactoryReset = async (mode: 'zero_balances' | 'full_factory_reset') => {
    setIsResetting(true);
    setResetSuccessMessage('');

    try {
      if (mode === 'zero_balances') {
        const zeroed = customers.map(c => ({
          ...c,
          walletCash: 0,
          copperBalance: 0,
          sharePercentage: 0,
          realizedProfit: 0,
          profitChangePercent: 0,
          averageBuyPrice: 0,
          inTransitChecks: 0,
          blockedCopper: 0,
        }));

        setCustomers(zeroed);
        setTransactions([]);
        setCompanyWarehouseCopper(0);

        localStorage.setItem('vateh_customers_v5', JSON.stringify(zeroed));
        localStorage.setItem('vateh_transactions_v5', JSON.stringify([]));
        localStorage.setItem('vateh_company_warehouse_copper_v5', '0');

        // Supabase sync: zero all existing customer records & delete all transactions
        await supabase.from('transactions').delete().neq('id', 'non_existent_id');
        await supabase.from('customers').upsert(zeroed.map(mapCustomerToDb));
        await supabase.from('company_settings').upsert({
          id: 1,
          company_warehouse_copper: 0,
          buy_copper_price: buyCopperPrice,
          sell_copper_price: sellCopperPrice,
          admin_password: adminPassword,
          updated_at: new Date().toISOString()
        });

        setResetSuccessMessage('تمام موجودی‌ها (ریالی، لوله مسی و انبار) و تراکنش‌ها با موفقیت صفر و در دیتابیس آنلاین همگام شدند.');
      } else {
        // Full factory reset
        setCustomers(INITIAL_CUSTOMERS);
        setTransactions([]);
        setCompanyWarehouseCopper(0);

        localStorage.setItem('vateh_customers_v5', JSON.stringify(INITIAL_CUSTOMERS));
        localStorage.setItem('vateh_transactions_v5', JSON.stringify([]));
        localStorage.setItem('vateh_company_warehouse_copper_v5', '0');

        // Supabase sync: delete all transactions, delete all customer records, insert fresh initial 4 customers with 0
        await supabase.from('transactions').delete().neq('id', 'non_existent_id');
        await supabase.from('customers').delete().neq('id', 'non_existent_id');
        await supabase.from('customers').insert(INITIAL_CUSTOMERS.map(mapCustomerToDb));
        await supabase.from('company_settings').upsert({
          id: 1,
          company_warehouse_copper: 0,
          buy_copper_price: buyCopperPrice,
          sell_copper_price: sellCopperPrice,
          admin_password: adminPassword,
          updated_at: new Date().toISOString()
        });

        setResetSuccessMessage('سیستم با موفقیت به تنظیمات اولیه کارخانه بازنشانی شد و تمام اطلاعات دیتابیس صفر گردید.');
      }
    } catch (err) {
      console.error('Error during factory reset:', err);
      setResetSuccessMessage('خطا در ارتباط با دیتابیس آنلاین، اما اطلاعات محلی با موفقیت صفر شد.');
    } finally {
      setIsResetting(false);
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
  
  // Filtered & Sorted transactions (for individual customer or all transactions)
  const myTransactions = transactions
    .filter(t => (myCustomerId ? t.customerId === myCustomerId : true))
    .filter(t => {
      if (txSubFilter === 'all') return true;
      if (txSubFilter === 'checks') {
        return Boolean(t.checkNumber) || t.type === 'check_register' || t.status === 'pending';
      }
      return t.type === txSubFilter;
    })
    .filter(t => {
      if (!txSearchQuery) return true;
      const q = txSearchQuery.trim().toLowerCase();
      const dayName = getPersianDayOfWeek(t.date);
      return (
        (t.customerName || '').toLowerCase().includes(q) ||
        (t.date || '').includes(q) ||
        dayName.includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.checkNumber || '').includes(q) ||
        (t.totalAmount || 0).toString().includes(q)
      );
    })
    .sort((a, b) => {
      if (txSortOrder === 'date_asc') {
        return a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '');
      }
      if (txSortOrder === 'amount_desc') {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
      if (txSortOrder === 'amount_asc') {
        return (a.totalAmount || 0) - (b.totalAmount || 0);
      }
      // Default: date_desc
      return b.date.localeCompare(a.date) || (b.time || '').localeCompare(a.time || '');
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
            <WattehLogo size={56} className="shadow-2xl shadow-blue-600/30 rounded-2xl" showBg={true} />
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
          <WattehLogo size={28} showBg={true} className="rounded-md" />
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

          {/* Weekly Backup button (Only for Admin - Small & Compact) */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveModal('pdf_backup')}
              title="تولید و دانلود فایل PDF بک‌آپ هفتگی اطلاعات"
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 hover:border-blue-300 rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0 font-extrabold text-[10px] md:text-xs shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>بک‌آپ هفتگی (PDF)</span>
            </button>
          )}

          {/* Factory Reset button (Only for Admin - Small & Compact) */}
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveModal('factory_reset')}
              title="بازنشانی اطلاعات به حالت کارخانه (Factory Reset)"
              className="p-1.5 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-xl border border-slate-200 transition bg-white flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline text-[10px] font-bold text-rose-600">ریست کارخانه</span>
            </button>
          )}

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
            {(() => {
              const pendingTxAll = transactions.filter(t => t.status === 'pending');
              const totalPendingChecks = pendingTxAll.reduce((acc, t) => acc + (t.totalAmount || 0), 0);

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                    <span className="text-[10px] text-slate-500 block">کل موجودی ریالی</span>
                    <span className="text-xs lg:text-sm font-extrabold text-slate-950 font-mono block">
                      {formatNumber(totalCashPool)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">مانده نقدی کل کیف‌ها</span>
                  </div>

                  {/* Pending In-Transit Checks Stat Card */}
                  <div 
                    onClick={() => {
                      setCheckbookTab('pending');
                      setActiveModal('manage_checks');
                    }}
                    className="bg-amber-50 hover:bg-amber-100/90 p-3 rounded-xl border border-amber-300 shadow-sm text-right space-y-1 transition cursor-pointer"
                    title="مشاهده و وصول چک‌های صیادی و اسناد در راه"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-900 font-black block">اسناد در راه (چک‌ها)</span>
                      {pendingTxAll.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                      )}
                    </div>
                    <span className="text-xs lg:text-sm font-extrabold text-amber-950 font-mono block">
                      {formatNumber(totalPendingChecks)}
                    </span>
                    <span className="text-[9px] text-amber-800 font-bold block">
                      {toPersianDigits(pendingTxAll.length)} چک در دست وصول (کلیک)
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                    <span className="text-[10px] text-slate-500 block">مجموع لوله مسی</span>
                    <span className="text-xs lg:text-sm font-extrabold text-slate-950 font-mono block">
                      {formatKg(totalCopperPool)} ک‌گ
                    </span>
                    <span className="text-[9px] text-slate-400 block">مجموع دارایی لوله مسی</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                    <span className="text-[10px] text-slate-500 block">ارزش روز لوله مسی</span>
                    <span className="text-xs lg:text-sm font-extrabold text-slate-950 font-mono block">
                      {formatNumber(totalCopperPool * buyCopperPrice)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">نرخ {formatNumber(buyCopperPrice)} ت</span>
                  </div>

                  <div className="bg-slate-900 text-white p-3 rounded-xl text-right space-y-1">
                    <span className="text-[10px] text-slate-400 block">مجموع کل دارایی‌ها</span>
                    <span className="text-xs lg:text-sm font-extrabold text-amber-400 font-mono block">
                      {formatNumber(totalAssetsVal)}
                    </span>
                    <span className="text-[9px] text-slate-400 block">نقدینگی + ارزش مس انبار</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                    <span className="text-[10px] text-slate-500 block">مجموع سود معاملات</span>
                    <span className="text-xs lg:text-sm font-extrabold text-emerald-600 font-mono block">
                      +{formatNumber(totalProfitPool)}+ ت
                    </span>
                    <span className="text-[9px] text-emerald-500 block">۱۵.۹٪ بازدهی کل</span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm text-right space-y-1">
                    <span className="text-[10px] text-slate-500 block">تعداد طرف‌های حساب</span>
                    <span className="text-xs lg:text-sm font-extrabold text-slate-950 block">
                      {customers.length} نفر
                    </span>
                    <span className="text-[9px] text-slate-400 block">خرید کل: ۱,۳۷۴ ک‌گ</span>
                  </div>

                </div>
              );
            })()}

            {/* 3. Customers Table with Roster Design (Strict Image 2 Design Match with Loleh Mesi terms) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 font-bold">
                  <button
                    type="button"
                    onClick={() => setAdminMainTab('customers')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${adminMainTab === 'customers' ? 'bg-white text-slate-950 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>دفتر حساب مشتریان ({customers.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminMainTab('all_transactions')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${adminMainTab === 'all_transactions' ? 'bg-white text-slate-950 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>کل تراکنش‌های سیستم ({transactions.length})</span>
                  </button>
                </div>

                {adminMainTab === 'customers' && (
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
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>افزودن حساب کاربری</span>
                    </button>

                    <button
                      onClick={() => setActiveModal('factory_reset')}
                      className="bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-2.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1 text-[11px] cursor-pointer"
                      title="بازنشانی کل اطلاعات به حالت اولیه کارخانه"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>ریست کارخانه</span>
                    </button>
                  </div>
                )}
              </div>

              {adminMainTab === 'customers' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase text-[11px]">
                        <th className="py-3.5 px-5 font-semibold">نام شخص</th>
                        <th className="py-3.5 px-4 font-semibold text-center">درصد سهم (بورس)</th>
                        <th className="py-3.5 px-4 font-semibold">موجودی ریالی (تومان)</th>
                        <th className="py-3.5 px-4 font-semibold text-amber-900 bg-amber-50/50">اسناد در راه (چک صیاد)</th>
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

                            <td className="py-4 px-4 font-mono bg-amber-50/30">
                              {cust.inTransitChecks > 0 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCheckbookTab('pending');
                                    setActiveModal('manage_checks');
                                  }}
                                  className="font-bold text-amber-950 hover:text-amber-700 text-xs bg-amber-100/80 hover:bg-amber-200/80 px-2 py-1 rounded-lg border border-amber-300 transition cursor-pointer inline-flex items-center gap-1"
                                  title="مشاهده چک در دفتر چک‌ها"
                                >
                                  <CreditCard className="w-3 h-3 text-amber-800" />
                                  <span>{formatNumber(cust.inTransitChecks)} ت</span>
                                </button>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
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
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => openDirectBalanceModal(cust.id)}
                                  className="bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-black px-3 py-2 rounded-xl transition text-[11px] flex items-center gap-1 cursor-pointer shadow-sm"
                                  title="ویرایش و تنظیم مستقیم موجودی پول و مس این شخص"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-amber-700" />
                                  <span>ویرایش موجودی</span>
                                </button>

                                <button
                                  onClick={() => setAdminSelectedCustomerId(cust.id)}
                                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-extrabold px-3 py-2 rounded-xl transition text-[11px] cursor-pointer"
                                >
                                  مشاهده
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomerToDelete({ id: cust.id, name: cust.name });
                                  }}
                                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition cursor-pointer"
                                  title="حذف حساب کاربری"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                            مشتری مورد نظر یافت نشد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Master Transactions Table View directly in main dashboard! */
                <div className="p-4 space-y-4">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Search box for transactions */}
                      <div className="relative">
                        <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                          <Search className="w-3.5 h-3.5" />
                        </span>
                        <input
                          type="text"
                          placeholder="جستجو در شرح، نام، تاریخ، چک..."
                          value={txSearchQuery}
                          onChange={(e) => setTxSearchQuery(e.target.value)}
                          className="pr-8 pl-2 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none w-56 text-xs font-sans font-bold"
                        />
                      </div>

                      {/* Sort order dropdown */}
                      <select
                        value={txSortOrder}
                        onChange={(e) => setTxSortOrder(e.target.value as any)}
                        className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-extrabold text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="date_desc">📅 مرتب‌سازی: جدیدترین تاریخ (از اخیر به قدیم)</option>
                        <option value="date_asc">📅 مرتب‌سازی: قدیمی‌ترین تاریخ (از قدیم به اخیر)</option>
                        <option value="amount_desc">💰 مرتب‌سازی: بیشترین مبلغ معامله</option>
                        <option value="amount_asc">💰 مرتب‌سازی: کمترین مبلغ معامله</option>
                      </select>
                    </div>

                    {/* Subfilter tabs inside table header */}
                    <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-black border flex-wrap">
                      <button 
                        onClick={() => setTxSubFilter('all')}
                        className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        همه تراکنش‌ها ({myTransactions.length})
                      </button>
                      <button 
                        onClick={() => setTxSubFilter('checks')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${txSubFilter === 'checks' ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>چک‌ها و اسناد درراه</span>
                      </button>
                      <button 
                        onClick={() => setTxSubFilter('buy')}
                        className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'buy' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        خرید مس
                      </button>
                      <button 
                        onClick={() => setTxSubFilter('sell')}
                        className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'sell' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        فروش مس
                      </button>
                      <button 
                        onClick={() => setTxSubFilter('deposit')}
                        className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'deposit' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        واریزها
                      </button>
                      <button 
                        onClick={() => setTxSubFilter('withdraw')}
                        className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'withdraw' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        برداشت‌ها
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
                    <table className="w-full text-right border-collapse text-xs bg-white">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                          <th className="py-3 px-4">ردیف</th>
                          <th className="py-3 px-4">نام طرف حساب</th>
                          <th className="py-3 px-4">روز هفته / تاریخ و زمان</th>
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
                          <tr key={tx.id} className={`hover:bg-slate-50/50 transition ${tx.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                            <td className="py-4 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-4 px-4 font-extrabold text-slate-900 bg-slate-50/40">
                              {tx.customerName}
                            </td>
                            <td className="py-4 px-4 font-mono">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-black text-amber-950 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                                  {getPersianDayOfWeek(tx.date)}
                                </span>
                                <span className="text-xs font-black text-slate-900">{tx.date}</span>
                              </div>
                              <span className="block text-[9px] text-slate-400 mt-1">ساعت {tx.time || '۰۹:۰۰:۰۰'}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-slate-950 block">
                                  {tx.type === 'buy' && '• خرید لوله مسی'}
                                  {tx.type === 'sell' && (tx.checkNumber ? '💳 فروش با دریافت چک' : '• فروش لوله مسی')}
                                  {tx.type === 'check_register' && '• ثبت چک تضمین'}
                                  {tx.type === 'adjustment' && '• سند اصلاح حساب'}
                                  {tx.type === 'deposit' && '• شارژ نقدی حساب'}
                                  {tx.type === 'withdraw' && '• برداشت وجه'}
                                </span>
                                {tx.checkNumber && (
                                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                    صیاد: {tx.checkNumber}
                                  </span>
                                )}
                              </div>
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
                              {tx.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-1 rounded-lg border border-amber-300 whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                                  <span>در انتظار وصول چک</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100 whitespace-nowrap">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{tx.checkNumber ? 'چک وصول' : 'تأیید نهایی'}</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-left">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedTx(tx);
                                    setActiveModal('receipt');
                                  }}
                                  className="text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-600/30 px-2.5 py-1 rounded-lg transition font-bold text-[10px] cursor-pointer"
                                >
                                  فاکتور چاپی
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {myTransactions.length === 0 && (
                          <tr>
                            <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                              هیچ سند تراکنشی یافت نشد.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
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
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => openDirectBalanceModal(activeProfile.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>ویرایش مستقیم موجودی پول و مس</span>
                    </button>
                    <button
                      onClick={() => setCustomerToDelete({ id: activeProfile.id, name: activeProfile.name })}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="حذف این حساب کاربری"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>حذف حساب</span>
                    </button>
                  </>
                )}
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

              <div 
                onClick={() => setTxSubFilter('checks')}
                className="bg-amber-50 border border-amber-200 hover:border-amber-300 p-4 rounded-xl text-right space-y-1 transition cursor-pointer"
                title="کلیک برای مشاهده لیست چک‌های صیادی و اسناد درراه"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-900 font-bold block">اسناد درراه (چک صیاد)</span>
                  {activeProfile.inTransitChecks > 0 && (
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-black animate-pulse">
                      در جریان وصول
                    </span>
                  )}
                </div>
                <span className="text-sm font-black text-amber-950 font-mono block">
                  {formatNumber(activeProfile.inTransitChecks)}
                </span>
                <span className="text-[9px] text-amber-800 block">
                  {activeProfile.blockedCopper} چک صیادی در دست وصول (کلیک جهت مشاهده)
                </span>
              </div>

            </div>

            {/* Quick Action buttons (Available for both Admin and Customer) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 block mb-3">عملیات سریع برای این حساب معاملاتی:</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => openActionModal('buy')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <span>+ خرید لوله مسی</span>
                </button>
                <button
                  onClick={() => openActionModal('sell')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <span>- فروش لوله مسی</span>
                </button>
                <button
                  onClick={() => openActionModal('deposit')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <span>📥 واریز وجه ریالی</span>
                </button>
                <button
                  onClick={() => openActionModal('withdraw')}
                  className="bg-red-600 hover:bg-red-700 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <span>📤 برداشت وجه ریالی</span>
                </button>
                {currentUser.role === 'admin' && (
                  <>
                    <button
                      onClick={() => openActionModal('check')}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
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
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <span>🎛️ سند اصلاح حساب / تعدیل</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Car-dex Table layout */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-xs lg:text-sm">ریزگردش معاملات و فاکتورهای حساب</h3>
                  <span className="text-[10px] text-slate-400 block mt-0.5">اسناد صادر شده و کاردکس رسمی کالا (مرتب‌سازی بر اساس تاریخ و روزهای هفته)</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search box for transactions */}
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="جستجو در شرح، تاریخ، چک..."
                      value={txSearchQuery}
                      onChange={(e) => setTxSearchQuery(e.target.value)}
                      className="pr-8 pl-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none w-44 text-[11px] font-sans"
                    />
                  </div>

                  {/* Sort order dropdown */}
                  <div className="relative">
                    <select
                      value={txSortOrder}
                      onChange={(e) => setTxSortOrder(e.target.value as any)}
                      className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-[11px] focus:outline-none cursor-pointer"
                    >
                      <option value="date_desc">📅 مرتب‌سازی: جدیدترین تاریخ (از اخیر به قدیم)</option>
                      <option value="date_asc">📅 مرتب‌سازی: قدیمی‌ترین تاریخ (از قدیم به اخیر)</option>
                      <option value="amount_desc">💰 مرتب‌سازی: بیشترین مبلغ معامله</option>
                      <option value="amount_asc">💰 مرتب‌سازی: کمترین مبلغ معامله</option>
                    </select>
                  </div>

                  {/* Subfilter tabs inside table header */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-black border flex-wrap">
                    <button 
                      onClick={() => setTxSubFilter('all')}
                      className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'all' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      همه تراکنش‌ها ({myTransactions.length})
                    </button>
                    <button 
                      onClick={() => setTxSubFilter('checks')}
                      className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${txSubFilter === 'checks' ? 'bg-amber-500 text-slate-950 shadow-sm font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>چک‌ها و اسناد درراه</span>
                      {activeProfile && activeProfile.inTransitChecks > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      )}
                    </button>
                    <button 
                      onClick={() => setTxSubFilter('buy')}
                      className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'buy' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      خرید مس
                    </button>
                    <button 
                      onClick={() => setTxSubFilter('sell')}
                      className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'sell' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      فروش مس
                    </button>
                    <button 
                      onClick={() => setTxSubFilter('deposit')}
                      className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'deposit' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      واریزها
                    </button>
                    <button 
                      onClick={() => setTxSubFilter('withdraw')}
                      className={`px-3 py-1.5 rounded-md transition-all ${txSubFilter === 'withdraw' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      برداشت‌ها
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-3 px-4">ردیف</th>
                      {!myCustomerId && <th className="py-3 px-4">طرف حساب</th>}
                      <th className="py-3 px-4">روز هفته / تاریخ و زمان</th>
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
                      <tr key={tx.id} className={`hover:bg-slate-50/50 transition ${tx.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                        <td className="py-4 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        {!myCustomerId && (
                          <td className="py-4 px-4 font-bold text-slate-900">
                            {tx.customerName}
                          </td>
                        )}
                        <td className="py-4 px-4 font-mono">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-black text-amber-950 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                              {getPersianDayOfWeek(tx.date)}
                            </span>
                            <span className="text-xs font-black text-slate-900">{tx.date}</span>
                          </div>
                          <span className="block text-[9px] text-slate-400 mt-1">ساعت {tx.time || '۰۹:۰۰:۰۰'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-950 block">
                              {tx.type === 'buy' && '• خرید لوله مسی'}
                              {tx.type === 'sell' && (tx.checkNumber ? '💳 فروش با دریافت چک' : '• فروش لوله مسی')}
                              {tx.type === 'check_register' && '• ثبت چک تضمین'}
                              {tx.type === 'adjustment' && '• سند اصلاح حساب'}
                              {tx.type === 'deposit' && '• شارژ نقدی حساب'}
                              {tx.type === 'withdraw' && '• برداشت وجه'}
                            </span>
                            {tx.checkNumber && (
                              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                                صیاد: {tx.checkNumber}
                              </span>
                            )}
                          </div>
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
                          {tx.status === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-1 rounded-lg border border-amber-300 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                              <span>در انتظار وصول چک</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{tx.checkNumber ? 'چک وصول و واریز شد' : 'تأیید نهایی'}</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedTx(tx);
                                setActiveModal('receipt');
                              }}
                              className="text-amber-700 hover:text-white hover:bg-amber-600 border border-amber-600/30 px-2.5 py-1 rounded-lg transition font-bold text-[10px] cursor-pointer"
                            >
                              فاکتور چاپی
                            </button>
                          </div>
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
              
              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Customer Selector for Admin OR User Info Badge */}
              {currentUser.role === 'admin' ? (
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    انتخاب حساب مشتری خریدار <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={buyCustomerId || adminSelectedCustomerId || customers[0]?.id || ''}
                    onChange={(e) => setBuyCustomerId(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — موجودی کیف: {formatNumber(c.walletCash)} تومان | مس: {formatKg(c.copperBalance)} ک‌گ
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-700" />
                    <span className="font-extrabold text-slate-900">{currentUser.name}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-slate-500 text-[10px] ml-1">موجودی فعلی کیف:</span>
                    <span className="font-black text-slate-950">{formatNumber(activeProfile?.walletCash || 0)} ت</span>
                  </div>
                </div>
              )}

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
                      const num = parseCleanNumber(e.target.value);
                      setBuyRate(num);
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
                const kgInput = parseCleanNumber(buyWeight);
                const totalCost = kgInput * buyRate;
                const activeId = currentUser?.role === 'customer' 
                  ? currentUser.id 
                  : (buyCustomerId || adminSelectedCustomerId || customers[0]?.id);
                const client = customers.find(c => c.id === activeId);
                const currentWallet = Number(client?.walletCash) || 0;
                const currentCopper = Number(client?.copperBalance) || 0;
                const remainingCash = currentWallet - totalCost;
                const projectedCopper = currentCopper + kgInput;

                return (
                  <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md border border-slate-800 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold">جمع کل فاکتور خرید:</span>
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

                    <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2.5">
                      <span className="text-slate-400 font-medium">موجودی مس پس از خرید:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {formatKg(projectedCopper)} کیلوگرم
                      </span>
                    </div>

                    {remainingCash < 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>مبلغ خرید از مانده نقدی فعلی بیشتر است (کسر از حساب انجام می‌شود).</span>
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
                  
                  {/* Form Error Banner */}
                  {formError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-bold animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{formError}</span>
                    </div>
                  )}

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
                              فروشنده: {c.name} (موجودی مس: {formatKg(c.copperBalance)} کیلوگرم | مانده نقدی: {formatNumber(c.walletCash)} ت)
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
                        <span>دریافت چک صیادی</span>
                      </button>
                    </div>

                    {/* Check fields if check */}
                    {sellPaymentType === 'check' && (
                      <div className="mt-2.5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                        
                        {/* Notice for check financial rule */}
                        <div className="p-2.5 bg-amber-100/80 border border-amber-300 rounded-xl text-[11px] text-amber-950 font-bold flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                          <span>قانون حسابداری چک: تا زمانی که چک پاس نشده، موجودی نقدی مشتری دست‌نخورده باقی می‌ماند و مبلغ در «اسناد درراه» قرار می‌گیرد. هر زمان چک وصول شد (یا زودتر از سررسید)، می‌توانید با زدن دکمه «تیک پاس شدن چک»، مبلغ را به موجودی نقدی واریز کنید.</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Due Date with ShamsiDatePicker */}
                          <div>
                            <ShamsiDatePicker
                              label="تاریخ سررسید چک صیادی"
                              required
                              value={sellCheckDueDate}
                              onChange={setSellCheckDueDate}
                              accentColor="amber"
                              presets={[
                                { label: '+۱۵ روز', daysOffset: 15 },
                                { label: '+۳۰ روز (یک‌ماهه)', daysOffset: 30 },
                                { label: '+۴۵ روز', daysOffset: 45 },
                                { label: '+۶۰ روز (دو‌ماهه)', daysOffset: 60 },
                                { label: '+۹۰ روز (سه‌ماهه)', daysOffset: 90 },
                              ]}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-black text-slate-800 mb-1.5">
                              شماره چک / شناسه صیاد <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={sellCheckNumber}
                              onChange={(e) => setSellCheckNumber(e.target.value)}
                              placeholder="مثال: ۵۶۵۶۶ یا شناسه ۱۶ رقمی"
                              className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-mono text-center text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-800 mb-1.5">
                            نام بانک صادرکننده
                          </label>
                          <input
                            type="text"
                            value={sellCheckBank}
                            onChange={(e) => setSellCheckBank(e.target.value)}
                            placeholder="مثال: بانک ملت، ملی، صادرات، تجارت..."
                            className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4. تاریخ معامله with ShamsiDatePicker */}
                  <div>
                    <ShamsiDatePicker
                      label="تاریخ ثبت فروش مس"
                      required
                      value={sellDate}
                      onChange={setSellDate}
                      accentColor="emerald"
                      presets={[
                        { label: 'امروز', daysOffset: 0 },
                        { label: 'دیروز', daysOffset: -1 },
                        { label: '۲ روز قبل', daysOffset: -2 },
                        { label: '۷ روز قبل', daysOffset: -7 },
                      ]}
                    />
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
                            const num = parseCleanNumber(e.target.value);
                            setSellRate(num);
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
              const depositVal = parseCleanNumber(depositAmount);
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
                          const num = parseCleanNumber(e.target.value);
                          setDepositAmount(num === 0 ? '' : formatNumber(num));
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

                  {/* 2. تاریخ واریز with ShamsiDatePicker */}
                  <div>
                    <ShamsiDatePicker
                      label="تاریخ واریز وجه"
                      required
                      value={depositDate}
                      onChange={setDepositDate}
                      accentColor="emerald"
                      presets={[
                        { label: 'امروز', daysOffset: 0 },
                        { label: 'دیروز', daysOffset: -1 },
                        { label: '۲ روز قبل', daysOffset: -2 },
                        { label: '۷ روز قبل', daysOffset: -7 },
                      ]}
                    />
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
              const withdrawVal = parseCleanNumber(withdrawAmount);
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
                          const num = parseCleanNumber(e.target.value);
                          setWithdrawAmount(num === 0 ? '' : formatNumber(num));
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

                  {/* 2. تاریخ برداشت with ShamsiDatePicker */}
                  <div>
                    <ShamsiDatePicker
                      label="تاریخ برداشت وجه"
                      required
                      value={withdrawDate}
                      onChange={setWithdrawDate}
                      accentColor="amber"
                      presets={[
                        { label: 'امروز', daysOffset: 0 },
                        { label: 'دیروز', daysOffset: -1 },
                        { label: '۲ روز قبل', daysOffset: -2 },
                        { label: '۷ روز قبل', daysOffset: -7 },
                      ]}
                    />
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
                <form onSubmit={submitAdjustment} className="p-5 md:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                  
                  {/* Mode Selector: Direct New Values vs Relative Deltas */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustTypeMode('direct');
                        if (selectedTarget) {
                          setDirectCashInput(formatNumber(selectedTarget.walletCash));
                          setDirectCopperInput(selectedTarget.copperBalance.toString());
                        }
                      }}
                      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        adjustTypeMode === 'direct'
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-slate-950" />
                      <span>ویرایش مستقیم (ثبت عدد جدید)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustTypeMode('relative')}
                      className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        adjustTypeMode === 'relative'
                          ? 'bg-slate-900 text-white shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>تعدیل نسبی (+ / -)</span>
                    </button>
                  </div>

                  {/* 1. نام فرد / طرف حساب * */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      نام فرد / طرف حساب <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={adjustCustomerId || adminSelectedCustomerId}
                        onChange={(e) => {
                          const newId = e.target.value;
                          setAdjustCustomerId(newId);
                          const target = customers.find(c => c.id === newId);
                          if (target) {
                            setDirectCashInput(formatNumber(target.walletCash));
                            setDirectCopperInput(target.copperBalance.toString());
                          }
                        }}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 appearance-none focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- انتخاب طرف حساب --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (موجودی فعلی: {formatNumber(c.walletCash)} ت | {formatKg(c.copperBalance)} ک‌گ)
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

                  {/* 3. تاریخ ثبت اصلاح * with ShamsiDatePicker */}
                  <div>
                    <ShamsiDatePicker
                      label="تاریخ ثبت سند اصلاحی"
                      required
                      value={adjustDate}
                      onChange={setAdjustDate}
                      accentColor="amber"
                      presets={[
                        { label: 'امروز', daysOffset: 0 },
                        { label: 'دیروز', daysOffset: -1 },
                        { label: '۲ روز قبل', daysOffset: -2 },
                        { label: '۷ روز قبل', daysOffset: -7 },
                      ]}
                    />
                  </div>

                  {/* Mode 1: DIRECT BALANCE EDIT (مقداردهی مستقیم) */}
                  {adjustTypeMode === 'direct' && (
                    <div className="space-y-4">
                      {/* Direct Cash Input */}
                      <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-extrabold text-slate-900">
                            موجودی نقدی جدید کیف پول (تومان) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setDirectCashInput('۰')}
                            className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                          >
                            صفر کردن پول
                          </button>
                        </div>
                        <div className="relative rounded-xl shadow-sm">
                          <input
                            type="text"
                            required
                            value={directCashInput}
                            onChange={(e) => {
                              const raw = toEnglishDigits(e.target.value.replace(/,/g, ''));
                              const num = parseFloat(raw);
                              setDirectCashInput(isNaN(num) ? '' : formatNumber(num));
                            }}
                            placeholder="مثال: ۵۰۰,۰۰۰,۰۰۰"
                            className="w-full pl-14 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-center font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-sm"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-slate-400 font-bold">
                            تومان
                          </div>
                        </div>
                        {parseCleanNumber(directCashInput) > 0 && (
                          <div className="text-left text-[11px] font-bold text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200">
                            {numToPersianWords(parseCleanNumber(directCashInput))} تومان
                          </div>
                        )}
                      </div>

                      {/* Direct Copper Input */}
                      <div className="space-y-2 bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-extrabold text-amber-950">
                            موجودی لوله مسی جدید (کیلوگرم) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setDirectCopperInput('۰')}
                            className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                          >
                            صفر کردن مس
                          </button>
                        </div>
                        <div className="relative rounded-xl shadow-sm">
                          <input
                            type="text"
                            required
                            value={directCopperInput}
                            onChange={(e) => setDirectCopperInput(e.target.value)}
                            placeholder="مثال: ۱۲۰"
                            className="w-full pl-16 pr-4 py-3 bg-white border border-amber-300 rounded-xl text-slate-900 font-mono text-center font-black text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition shadow-sm"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-amber-800 font-bold">
                            کیلوگرم
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: RELATIVE DELTAS (+ / -) */}
                  {adjustTypeMode === 'relative' && (
                    <div className="space-y-4">
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
                    </div>
                  )}

                  {/* 6. علت اصلاح حساب */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      علت و شرح تغییر موجودی
                    </label>
                    <div className="relative">
                      <textarea
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="دلیل تغییر (مثلاً: تنظیم مستقیم توسط مدیر، خطای ثبت قبلی، تسویه دستی...)"
                        rows={2}
                        className="w-full p-3 pr-10 pl-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-bold"
                      />
                      <FileText className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 flex gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 px-6 rounded-xl transition duration-150 text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>{adjustTypeMode === 'direct' ? 'ثبت و اعمال مستقیم موجودی‌های جدید' : 'ثبت سند اصلاح حساب'}</span>
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

      {/* 12. MODAL: "ریست کارخانه و صفر کردن موجودی‌ها (Factory Reset)" */}
      {activeModal === 'factory_reset' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white p-5 flex justify-between items-center shadow-sm">
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">حذف کارخانه و صفر کردن سیستم</h3>
                  <p className="text-[11px] text-rose-300 mt-0.5">پاکسازی موجودی‌ها، انبار و همگام‌سازی کامل با دیتابیس</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center shadow-inner">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-4">

              {/* Warning Alert Banner */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-black text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>هشدار بازنشانی و همگام‌سازی دیتابیس آنلاین</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed pr-6">
                  با تایید این بخش، تمام موجودی‌های ثبت‌شده از قبل (موجودی ریالی کیف پول‌ها و موجودی لوله مسی) صفر می‌شوند و اسناد و تراکنش‌ها پاک شده و این تغییرات فوراً در پایگاه داده (Supabase) ثبت می‌گردد.
                </p>
              </div>

              {/* Status Preview Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-[11px] font-extrabold text-slate-700 block mb-1">
                  خلاصه اطلاعات که به صفر تغییر خواهند یافت:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">کل موجودی ریالی فعلی:</span>
                    <span className="font-black text-slate-900 font-mono mt-0.5 block">{formatNumber(totalCashPool)} تومان</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">کل موجودی مس فعلی:</span>
                    <span className="font-black text-amber-700 font-mono mt-0.5 block">{formatKg(totalCopperPool)} کیلوگرم</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">موجودی انبار مرکزی:</span>
                    <span className="font-black text-slate-900 font-mono mt-0.5 block">{formatKg(companyWarehouseCopper)} کیلوگرم</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">تعداد تراکنش‌های ثبت‌شده:</span>
                    <span className="font-black text-slate-900 font-mono mt-0.5 block">{transactions.length} فقره سند</span>
                  </div>
                </div>
              </div>

              {/* Success Message Banner */}
              {resetSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              {/* Backup & Restore Tools */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between font-black text-blue-950">
                  <span className="flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>پشتیبان‌گیری (بک‌آپ) و بازگردانی اطلاعات:</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-md">
                    توصیه: هر هفته ۱ بار
                  </span>
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal('pdf_backup')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-200" />
                    <span>تولید و دانلود فایل PDF بک‌آپ هفتگی (همه اسناد)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleLoadOfficialPdfBackupData}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-sm cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-emerald-200" />
                    <span>بارگذاری کامل بک‌آپ دفتری (۴ حساب، ۳۰ سند شهریور ۱۴۰۵) و سینک به دیتابیس</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => handleFactoryReset('zero_balances')}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3.5 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'در حال صفر کردن و سینک دیتابیس...' : 'صفر کردن تمام موجودی‌ها و اسناد (سینک کامل دیتابیس)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isResetting}
                  onClick={() => handleFactoryReset('full_factory_reset')}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>بازنشانی کامل سیستم به تنظیمات اولیه کارخانه (حذف حساب‌های تستی اضافه)</span>
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  بستن پنجره
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 13. MODAL: "تایید حذف حساب کاربری" (Delete Customer Confirmation) */}
      {customerToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="bg-rose-600 text-white p-5 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setCustomerToDelete(null)} 
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">حذف حساب کاربری</h3>
                  <p className="text-[11px] text-rose-100 mt-0.5">حذف دائم از سیستم و پایگاه داده</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-xs text-slate-700 leading-relaxed text-right space-y-2">
                <p>
                  آیا از حذف حساب کاربری <strong className="text-rose-600 font-extrabold text-sm font-sans">{customerToDelete.name}</strong> اطمینان کامل دارید؟
                </p>
                <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  ⚠️ این عملیات غیرقابل بازگشت است؛ تمامی تراکنش‌ها، موجودی‌ها و اسناد این شخص مستقیماً از پایگاه داده آنلاین (Supabase) و سیستم حذف خواهند شد.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isDeletingCustomer}
                  onClick={confirmDeleteCustomer}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingCustomer ? 'در حال حذف از دیتابیس...' : 'بله، حذف قطعی حساب'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerToDelete(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition text-xs cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. MODAL: "دفتر مدیریت چک‌های صیادی و وصول اسناد در راه" (Manage Checks) */}
      {activeModal === 'manage_checks' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-100 my-6 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <h4 className="text-base font-black text-white">دفتر مدیریت چک‌های صیادی و اسناد در راه</h4>
                  <p className="text-xs text-amber-200/80 mt-0.5">
                    وصول فوری، نظارت بر سررسیدها و مدیریت اسناد در انتظار واریز به کیف پول
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content & Tabs */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Notice Banner */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span>قانون حسابداری مس و اته:</span>
                  <span className="font-normal block mt-0.5 text-amber-900">
                    تا زمانی که چک پاس نشده، مبلغ آن در ستون «اسناد درراه» نگهداری شده و به موجودی نقدی اضافه نمی‌گردد. هر زمان چک توسط بانک پاس شد (یا حتی پیش از موعد)، کافیست دکمه سبز <strong>«تیک پاس شدن چک»</strong> را بزنید تا مبلغ مستقیماً به کیف پول مشتری واریز شود.
                  </span>
                </div>
              </div>

              {/* Tabs: Pending vs Cleared */}
              {(() => {
                const visibleChecks = transactions.filter(t => 
                  (currentUser.role === 'admin' || t.customerId === currentUser.id) &&
                  (t.checkNumber || t.type === 'check_register')
                );
                const pendingChecks = visibleChecks.filter(t => t.status === 'pending');
                const clearedChecks = visibleChecks.filter(t => t.status === 'completed');

                return (
                  <div className="space-y-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-black">
                      <button
                        type="button"
                        onClick={() => setCheckbookTab('pending')}
                        className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          checkbookTab === 'pending'
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>چک‌های در انتظار وصول ({toPersianDigits(pendingChecks.length)})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckbookTab('cleared')}
                        className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          checkbookTab === 'cleared'
                            ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>چک‌های وصول‌شده و آرشیو ({toPersianDigits(clearedChecks.length)})</span>
                      </button>
                    </div>

                    {/* Pending Tab Content */}
                    {checkbookTab === 'pending' && (
                      <div className="space-y-3">
                        {pendingChecks.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            در حال حاضر هیچ چک پاس‌نشده‌ای در جریان وصول وجود ندارد.
                          </div>
                        ) : (
                          pendingChecks.map(check => {
                            const cust = customers.find(c => c.id === check.customerId);
                            return (
                              <div key={check.id} className="bg-white p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-400 shadow-sm transition space-y-3 text-right">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-amber-100 text-amber-900 font-mono font-black px-2.5 py-1 rounded-lg text-xs border border-amber-300">
                                      شناسه صیاد: {check.checkNumber || 'ثبت‌شده'}
                                    </span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                      صاحب حساب: {check.customerName}
                                    </span>
                                  </div>

                                  <div className="font-mono text-left">
                                    <span className="text-[10px] text-slate-400 ml-1">مبلغ چک:</span>
                                    <span className="text-base font-black text-emerald-600">
                                      {formatNumber(check.totalAmount)} تومان
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 text-[10px] block">نوع معامله / سند:</span>
                                    <span className="font-bold text-slate-800">
                                      {check.type === 'sell' ? 'فروش لوله مسی با چک' : 'چک تضمین مسدود مس'}
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 text-[10px] block">تاریخ ثبت معامله:</span>
                                    <span className="font-mono font-bold text-slate-800">{check.date}</span>
                                  </div>
                                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="text-slate-400 text-[10px] block">موجودی فعلی کیف پول:</span>
                                    <span className="font-mono font-bold text-slate-800">{formatNumber(cust?.walletCash || 0)} ت</span>
                                  </div>
                                </div>

                                <p className="text-xs text-slate-500 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 font-medium">
                                  {check.description}
                                </p>

                                {/* Action button: Ticking / Passing the Check */}
                                <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    <span>با زدن تیک، مبلغ بلافاصله به کیف پول مشتری واریز می‌شود:</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setCheckToPass(check)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                                    <span>تیک پاس شدن چک (وصول فوری)</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Cleared Tab Content */}
                    {checkbookTab === 'cleared' && (
                      <div className="space-y-3">
                        {clearedChecks.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            هنوز هیچ چکی وصول و آرشیو نشده است.
                          </div>
                        ) : (
                          clearedChecks.map(check => (
                            <div key={check.id} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-right">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-100 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                                    صیاد: {check.checkNumber}
                                  </span>
                                  <span className="font-extrabold text-slate-900">{check.customerName}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 block">{check.description}</span>
                              </div>

                              <div className="text-left font-mono">
                                <span className="font-black text-emerald-700 text-sm block">
                                  {formatNumber(check.totalAmount)} ت
                                </span>
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                                  <Check className="w-3 h-3" />
                                  <span>وصول و واریز شد</span>
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer transition"
              >
                بستن پنجره
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 15. MODAL: "تأیید پاس شدن چک صیادی" (Confirm Pass Check Modal) */}
      {checkToPass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setCheckToPass(null)} 
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h3 className="text-base font-black text-white">تأیید پاس شدن چک صیادی</h3>
                  <p className="text-[11px] text-emerald-100 mt-0.5">وصول وجه و واریز مستقیم به موجودی نقدی</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-white/20 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Body */}
            {(() => {
              const cust = customers.find(c => c.id === checkToPass.customerId);
              const curCash = cust?.walletCash || 0;
              const newCash = curCash + checkToPass.totalAmount;

              return (
                <div className="p-6 space-y-4 text-right">
                  <p className="text-xs text-slate-700 leading-relaxed">
                    آیا اطمینان دارید چک صیادی شماره <strong className="font-mono font-black text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">{checkToPass.checkNumber || 'ثبت‌شده'}</strong> پاس شده است؟
                  </p>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">طرف حساب دریافت‌کننده:</span>
                      <span className="font-black text-slate-900">{checkToPass.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                      <span className="text-slate-500 font-medium">مبلغ چک صیادی:</span>
                      <span className="font-mono font-black text-emerald-600 text-sm">
                        {formatNumber(checkToPass.totalAmount)} تومان
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/80 pt-2">
                      <span className="text-slate-500 font-medium">موجودی فعلی کیف پول:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {formatNumber(curCash)} تومان
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-200/80 pt-2 bg-emerald-50 -mx-4 -mb-4 p-3 rounded-b-2xl border-t border-emerald-200">
                      <span className="text-emerald-950 font-black">موجودی نقدی پس از پاس شدن:</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        {formatNumber(newCash)} تومان
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={isPassingCheck}
                      onClick={() => handlePassCheck(checkToPass.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-3 px-4 rounded-xl transition text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      <span>{isPassingCheck ? 'در حال ثبت وصول...' : 'بله، تیک پاس شدن را بزن'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckToPass(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-5 rounded-xl transition text-xs cursor-pointer"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* 16. TOAST NOTIFICATION: Feedback for users */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 left-5 md:left-auto md:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200" dir="rtl">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
            toastMessage.type === 'success' 
              ? 'bg-slate-900 text-white border-emerald-500' 
              : toastMessage.type === 'error'
              ? 'bg-slate-900 text-white border-rose-500'
              : 'bg-slate-900 text-white border-amber-500'
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              toastMessage.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            </div>
            <div className="flex-1 text-right space-y-1">
              <h5 className="text-xs font-black text-white">{toastMessage.title}</h5>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{toastMessage.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 16. MODAL: "گزارش و بک‌آپ هفتگی مالی (فایل PDF)" */}
      {activeModal === 'pdf_backup' && (() => {
        const totalWalletCash = customers.reduce((sum, c) => sum + (c.walletCash || 0), 0);
        const pendingChecksList = transactions.filter(t => t.status === 'pending' && (t.checkNumber || t.type === 'check_register'));
        const pendingChecksTotalAmount = pendingChecksList.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

        return (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 z-50 overflow-y-auto" dir="rtl">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-150">
              
              {/* Action Header / Toolbar (Hidden on Print) */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">گزارش و فایل بک‌آپ هفتگی سامانه (PDF)</h3>
                    <p className="text-xs text-blue-200/80">پیش‌نمایش سند رسمی پشتیبان مالی، حساب‌ها و موجودی انبار</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleLoadOfficialPdfBackupData}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 text-xs shadow cursor-pointer disabled:opacity-50"
                  >
                    <Database className={`w-3.5 h-3.5 text-amber-200 ${isResetting ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isResetting ? 'در حال سینک...' : 'سینک کامل به دیتابیس'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPdfPrintWindow}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl transition flex items-center gap-2 text-xs shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-200" />
                    <span>خروجی و ذخیره PDF در مرورگر</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdfBackup}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-200" />
                    <span className="hidden sm:inline">دانلود فایل PDF</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Content Container */}
              <div id="pdf-backup-report" className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto printable-area bg-white text-slate-900">
                
                {/* Document Official Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow">
                        و
                      </div>
                      <div>
                        <h1 className="text-lg font-black text-slate-950">گزارش و بک‌آپ هفتگی سامانه معاملات مس واته</h1>
                        <span className="text-xs font-bold text-amber-800 block">پلتفرم مدیریت معاملات کاتد، لوله مسی و اسناد صیادی</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 pt-1">سند پشتیبان مالی رسمی دفتری جهت بایگانی هفتگی مدیریت</p>
                  </div>

                  <div className="text-left space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs font-mono">
                    <div className="flex gap-2 justify-end text-slate-700">
                      <span className="font-bold">{getTodayShamsi()}</span>
                      <span className="text-slate-400">:تاریخ بک‌آپ</span>
                    </div>
                    <div className="flex gap-2 justify-end text-slate-700">
                      <span className="font-bold">{new Date().toLocaleTimeString('fa-IR')}</span>
                      <span className="text-slate-400">:زمان ثبت</span>
                    </div>
                    <div className="flex gap-2 justify-end text-slate-700">
                      <span className="font-bold">{currentUser.name}</span>
                      <span className="text-slate-400">:صادرکننده</span>
                    </div>
                  </div>
                </div>

                {/* Summary Financial Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-900 block">موجودی کیف پول ریالی:</span>
                    <span className="text-sm md:text-base font-black text-amber-950 font-mono block mt-1">
                      {formatNumber(totalWalletCash)} <span className="text-[10px] font-normal">تومان</span>
                    </span>
                  </div>

                  <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200">
                    <span className="text-[11px] font-bold text-orange-900 block">موجودی انبار مس:</span>
                    <span className="text-sm md:text-base font-black text-orange-950 font-mono block mt-1">
                      {formatKg(companyWarehouseCopper)} <span className="text-[10px] font-normal">کیلوگرم</span>
                    </span>
                  </div>

                  <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                    <span className="text-[11px] font-bold text-blue-900 block">مجموع چک‌های صیادی معوق:</span>
                    <span className="text-sm md:text-base font-black text-blue-950 font-mono block mt-1">
                      {formatNumber(pendingChecksTotalAmount)} <span className="text-[10px] font-normal">تومان</span>
                    </span>
                  </div>

                  <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 block">تعداد حساب‌های فعال:</span>
                    <span className="text-sm md:text-base font-black text-slate-900 font-mono block mt-1">
                      {customers.length} <span className="text-[10px] font-normal">طرف حساب</span>
                    </span>
                  </div>
                </div>

                {/* Table 1: All Customer Balances Roster */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-r-4 border-amber-500 pr-2">
                    <span>۱. دفتر کل تراز حساب‌ها و موجودی مشتریان</span>
                  </h2>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">نام مشتری</th>
                          <th className="p-2.5">شماره تماس</th>
                          <th className="p-2.5 text-center">موجودی ریالی (تومان)</th>
                          <th className="p-2.5 text-center">موجودی مس (کیلوگرم)</th>
                          <th className="p-2.5 text-center">چک‌های معوق</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {customers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{c.name}</td>
                            <td className="p-2.5 font-mono text-slate-600">{c.mobile || '-'}</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-700">
                              {formatNumber(c.walletCash)}
                            </td>
                            <td className="p-2.5 text-center font-mono font-bold text-orange-700">
                              {formatKg(c.copperBalance)}
                            </td>
                            <td className="p-2.5 text-center font-mono text-xs">
                              {c.inTransitChecks ? (
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">
                                  {formatNumber(c.inTransitChecks)} تومان
                                </span>
                              ) : (
                                <span className="text-slate-400">بدون چک</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 2: Pending Sayadi Checks */}
                {pendingChecksList.length > 0 && (
                  <div className="space-y-2">
                    <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-r-4 border-blue-600 pr-2">
                      <span>۲. اسناد درراه و چک‌های صیادی در انتظار وصول</span>
                    </h2>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-blue-50 text-blue-900 font-black border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">شناسه صیادی</th>
                            <th className="p-2.5">نام مشتری</th>
                            <th className="p-2.5 text-center">مبلغ چک (تومان)</th>
                            <th className="p-2.5 text-center">تاریخ ثبت/سررسید</th>
                            <th className="p-2.5">شرح و نوع معامله</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {pendingChecksList.map((ch) => (
                            <tr key={ch.id}>
                              <td className="p-2.5 font-mono font-bold text-blue-900">{ch.checkNumber || '-'}</td>
                              <td className="p-2.5 font-bold text-slate-900">{ch.customerName}</td>
                              <td className="p-2.5 text-center font-mono font-black text-amber-900">
                                {formatNumber(ch.totalAmount)}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-slate-700">{ch.date}</td>
                              <td className="p-2.5 text-slate-600 text-[11px]">{ch.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 3: Detailed Transactions Ledger by Customer */}
                <div className="space-y-3">
                  <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-r-4 border-emerald-600 pr-2">
                    <span>۳. دفتر ریز تراکنش‌ها و ریز اسناد مالی اشخاص</span>
                  </h2>

                  {customers.map((cust) => {
                    const custTxs = transactions.filter(t => t.customerId === cust.id);
                    if (custTxs.length === 0) return null;

                    return (
                      <div key={cust.id} className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <div className="bg-slate-100 p-2.5 font-extrabold text-slate-900 flex justify-between items-center border-b border-slate-200">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                            <span>طرف حساب: {cust.name}</span>
                            <span className="text-slate-500 font-mono text-[11px]">({cust.mobile || '-'})</span>
                          </span>
                          <span className="text-[11px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            تعداد سوابق: {custTxs.length} فقره
                          </span>
                        </div>

                        <table className="w-full text-right text-[11px]">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-2">روز هفته / تاریخ و زمان</th>
                              <th className="p-2">نوع معامله</th>
                              <th className="p-2 text-center">وزن مس (kg)</th>
                              <th className="p-2 text-center">مبلغ کل (تومان)</th>
                              <th className="p-2 text-center">کیف پول بعد معامله</th>
                              <th className="p-2">شرح و شناسه سند</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {custTxs.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="p-2 font-mono text-slate-700">
                                  <span className="font-bold text-amber-800 text-[10px] block">{getPersianDayOfWeek(tx.date)}</span>
                                  <span>{tx.date}</span>
                                  {tx.time && <span className="text-[10px] text-slate-400 block">ساعت {tx.time}</span>}
                                </td>
                                <td className="p-2 font-black text-slate-900">
                                  {tx.type === 'buy' && 'خرید لوله مسی'}
                                  {tx.type === 'sell' && 'فروش لوله مسی'}
                                  {tx.type === 'deposit' && 'شارژ کیف پول'}
                                  {tx.type === 'withdraw' && 'تسویه/برداشت'}
                                  {tx.type === 'check_register' && 'ثبت چک صیادی'}
                                  {tx.type === 'adjustment' && 'اصلاح حساب'}
                                </td>
                                <td className="p-2 text-center font-mono font-bold text-orange-800">
                                  {tx.amountKg ? formatKg(tx.amountKg) : '-'}
                                </td>
                                <td className="p-2 text-center font-mono font-black text-slate-950">
                                  {formatNumber(tx.totalAmount)}
                                </td>
                                <td className="p-2 text-center font-mono font-extrabold text-emerald-800">
                                  {tx.afterWalletCash !== undefined ? `${formatNumber(tx.afterWalletCash)} ت` : '-'}
                                </td>
                                <td className="p-2 text-slate-600 text-[10px]">
                                  {tx.description || '-'}
                                  {tx.checkNumber && (
                                    <span className="block font-mono font-bold text-blue-900 text-[10px] mt-0.5">
                                      [شناسه صیادی: {tx.checkNumber}]
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                {/* Signatures & Footer Note */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-700">
                  <div className="space-y-8">
                    <span className="font-bold block">محل مهر و امضای مدیر حسابداری:</span>
                    <div className="h-10 border-b border-dashed border-slate-300 w-2/3 mx-auto"></div>
                  </div>
                  <div className="space-y-8">
                    <span className="font-bold block">محل مهر و امضای مدیر عامل (واته):</span>
                    <div className="h-10 border-b border-dashed border-slate-300 w-2/3 mx-auto"></div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2">
                  این فایل رسمی به عنوان گزارش پشتیبان (بک‌آپ) هفتگی توسط سامانه اتوماتیک معاملات مس واته صادر گردیده است.
                </div>

              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
