import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Printer,
  Plus,
  Play,
  Check,
  XCircle,
  Bell,
  Utensils,
  Truck,
  Package,
  Phone,
  MapPin,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus, RestaurantSettings } from '../types';
import { formatCurrency, formatTimeAgo, formatClockTime, isOrderOverdue } from '../utils/formatters';

interface OrderReceivedViewProps {
  orders: Order[];
  settings: RestaurantSettings;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onToggleItemCheck?: (orderId: string, itemIdx: number) => void;
  onBatchUpdateStatus?: (orderIds: string[], newStatus: OrderStatus) => void;
  onViewReceipt: (order: Order) => void;
  onCreateWalkInOrder: () => void;
}

export const OrderReceivedView: React.FC<OrderReceivedViewProps> = ({
  orders,
  settings,
  onUpdateOrderStatus,
  onToggleItemCheck,
  onBatchUpdateStatus,
  onViewReceipt,
  onCreateWalkInOrder,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all_received');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [localCheckedItems, setLocalCheckedItems] = useState<{ [orderId: string]: number[] }>({});

  // Active / received orders (pending, preparing, ready)
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
    );
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      let matchStatus = true;
      if (selectedFilter === 'pending') {
        matchStatus = order.status === 'pending';
      } else if (selectedFilter === 'preparing') {
        matchStatus = order.status === 'preparing';
      } else if (selectedFilter === 'ready') {
        matchStatus = order.status === 'ready';
      } else if (selectedFilter === 'overdue') {
        matchStatus = isOrderOverdue(order.createdAt, order.status, settings.overdueThresholdMinutes);
      }

      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.phone && order.phone.includes(searchQuery)) ||
        (order.tableNumber && order.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [activeOrders, selectedFilter, searchQuery, settings.overdueThresholdMinutes]);

  // Counts
  const pendingCount = activeOrders.filter((o) => o.status === 'pending').length;
  const preparingCount = activeOrders.filter((o) => o.status === 'preparing').length;
  const readyCount = activeOrders.filter((o) => o.status === 'ready').length;
  const overdueCount = activeOrders.filter((o) =>
    isOrderOverdue(o.createdAt, o.status, settings.overdueThresholdMinutes)
  ).length;

  // Toggle order checkbox for batch operations
  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    }
  };

  // Toggle item tickbox inside a single order card
  const handleToggleDishItem = (orderId: string, itemIdx: number) => {
    if (onToggleItemCheck) {
      onToggleItemCheck(orderId, itemIdx);
    } else {
      setLocalCheckedItems((prev) => {
        const cur = prev[orderId] || [];
        const next = cur.includes(itemIdx) ? cur.filter((i) => i !== itemIdx) : [...cur, itemIdx];
        return { ...prev, [orderId]: next };
      });
    }
  };

  // Batch actions
  const handleBatchAdvance = (nextStatus: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    if (onBatchUpdateStatus) {
      onBatchUpdateStatus(selectedOrderIds, nextStatus);
    } else {
      selectedOrderIds.forEach((id) => onUpdateOrderStatus(id, nextStatus));
    }
    setSelectedOrderIds([]);
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in':
        return <Utensils className="w-3.5 h-3.5 text-[#1f4d3e]" />;
      case 'takeaway':
        return <Package className="w-3.5 h-3.5 text-[#c8791f]" />;
      case 'delivery':
        return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header & POS Shortcut */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#1b2620] flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#1f4d3e]" />
            <span>Order Received (Live Queue)</span>
          </h2>
          <p className="text-xs text-[#8b978f]">
            Tick off items & update tickets from Received to Ready
          </p>
        </div>

        <button
          type="button"
          id="order-received-new-btn"
          onClick={onCreateWalkInOrder}
          className="px-3.5 py-2 rounded-xl bg-[#1f4d3e] text-white text-xs font-bold hover:bg-[#143529] transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New POS Order</span>
        </button>
      </div>

      {/* Overdue Warning Alert */}
      {overdueCount > 0 && (
        <div className="p-3 bg-[#f6e2de] border border-[#b3402f]/40 rounded-2xl flex items-center justify-between text-[#8a2c1f]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#b3402f]" />
            <span className="text-xs font-bold">
              {overdueCount} {overdueCount === 1 ? 'order is' : 'orders are'} overdue ({settings.overdueThresholdMinutes}m+ threshold)!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFilter('overdue')}
            className="text-[11px] font-extrabold uppercase bg-[#b3402f] text-white px-2 py-0.5 rounded-md hover:bg-[#8a2c1f]"
          >
            Show Overdue
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedFilter('all_received')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            selectedFilter === 'all_received'
              ? 'bg-[#1f4d3e] text-white shadow-xs'
              : 'bg-white text-[#4c5a52] border border-[#e2e4dc]'
          }`}
        >
          All Received ({activeOrders.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('pending')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            selectedFilter === 'pending'
              ? 'bg-[#c8791f] text-white'
              : 'bg-white text-[#4c5a52] border border-[#e2e4dc]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#c8791f] animate-pulse" />
          <span>New ({pendingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('preparing')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            selectedFilter === 'preparing'
              ? 'bg-[#2c4a83] text-white'
              : 'bg-white text-[#4c5a52] border border-[#e2e4dc]'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          <span>In Kitchen ({preparingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter('ready')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
            selectedFilter === 'ready'
              ? 'bg-emerald-700 text-white'
              : 'bg-white text-[#4c5a52] border border-[#e2e4dc]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Ready ({readyCount})</span>
        </button>
      </div>

      {/* Search & Batch Action Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b978f]" />
          <input
            type="text"
            id="order-received-search"
            placeholder="Search Order #, Customer, or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#e2e4dc] rounded-xl text-xs placeholder-[#8b978f] focus:outline-none focus:border-[#1f4d3e]"
          />
        </div>

        {filteredOrders.length > 0 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-3 py-2 bg-white border border-[#e2e4dc] text-[#4c5a52] text-xs font-bold rounded-xl hover:bg-gray-50 shrink-0 flex items-center gap-1.5"
          >
            {selectedOrderIds.length === filteredOrders.length ? (
              <CheckSquare className="w-4 h-4 text-[#1f4d3e]" />
            ) : (
              <Square className="w-4 h-4 text-[#8b978f]" />
            )}
            <span>Select All</span>
          </button>
        )}
      </div>

      {/* Floating Batch Actions Bar when tickets are selected */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-[#1f4d3e] text-white p-3 rounded-2xl flex items-center justify-between gap-2 shadow-lg animate-in slide-in-from-top-2">
          <span className="text-xs font-bold">
            {selectedOrderIds.length} orders selected
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleBatchAdvance('preparing')}
              className="px-2.5 py-1.5 rounded-lg bg-[#2c4a83] text-white text-[11px] font-bold hover:bg-[#203660]"
            >
              Tick → Cooking
            </button>
            <button
              type="button"
              onClick={() => handleBatchAdvance('ready')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
            >
              Tick → Ready
            </button>
            <button
              type="button"
              onClick={() => handleBatchAdvance('completed')}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-800 text-white text-[11px] font-bold hover:bg-emerald-900"
            >
              Tick → Complete
            </button>
          </div>
        </div>
      )}

      {/* Orders List with Tick Boxes */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e2e4dc] p-6">
            <CheckSquare className="w-10 h-10 text-[#8b978f] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#1b2620]">No active received orders</p>
            <p className="text-xs text-[#8b978f] mt-1">
              New orders placed via Customer Kiosk or POS will appear here instantly.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrderIds.includes(order.id);
            const overdue = isOrderOverdue(order.createdAt, order.status, settings.overdueThresholdMinutes);
            const checkedIndices = order.checkedItemIndices || localCheckedItems[order.id] || [];
            const allItemsChecked = order.items.length > 0 && checkedIndices.length === order.items.length;

            return (
              <div
                key={order.id}
                id={`received-order-card-${order.id}`}
                className={`bg-white border rounded-2xl p-4 transition-all shadow-2xs ${
                  isSelected
                    ? 'border-[#1f4d3e] ring-2 ring-[#1f4d3e]/30'
                    : overdue
                    ? 'border-[#b3402f] ring-1 ring-[#b3402f]/50'
                    : 'border-[#e2e4dc]'
                }`}
              >
                {/* Header with Tick box selection */}
                <div className="flex items-start justify-between gap-2 border-b border-[#e2e4dc]/70 pb-3">
                  <div className="flex items-start gap-2.5">
                    {/* Multi-select check box */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectOrder(order.id)}
                      className="mt-0.5 text-[#1f4d3e] hover:opacity-80 p-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 fill-[#1f4d3e] text-white" />
                      ) : (
                        <Square className="w-5 h-5 text-[#8b978f]" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-extrabold text-[#143529]">
                          {order.orderNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1f4d3e] bg-[#e3ede8] px-2 py-0.5 rounded-md">
                          {renderTypeIcon(order.orderType)}
                          <span className="capitalize">{order.orderType.replace('_', ' ')}</span>
                        </span>
                        {order.source && (
                          <span className="text-[10px] font-semibold text-[#8b978f] bg-gray-100 px-1.5 py-0.5 rounded">
                            {order.source}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-[#1b2620] mt-1">
                        {order.customerName}
                        {order.tableNumber && (
                          <span className="text-[#1f4d3e] ml-1.5 font-extrabold">
                            • {order.tableNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-[#8b978f] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(order.createdAt)} ({formatClockTime(order.createdAt)})
                        </span>
                        {order.phone && <span>• Tel: {order.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {order.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#f7e9d6] text-[#8a540f] border border-[#c8791f]/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c8791f] animate-ping" />
                        Received
                      </span>
                    )}
                    {order.status === 'preparing' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#dde6f5] text-[#2c4a83] border border-[#2c4a83]/20 flex items-center gap-1">
                        <ChefHat className="w-3 h-3" /> In Kitchen
                      </span>
                    )}
                    {order.status === 'ready' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#e3ede8] text-[#143529] border border-[#1f4d3e]/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                      </span>
                    )}

                    {overdue && (
                      <span className="text-[10px] font-extrabold text-[#b3402f] bg-[#f6e2de] px-2 py-0.2 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Checklist with individual dish Tick boxes */}
                <div className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#8b978f] uppercase pb-1">
                    <span>Dish Items Checklist ({checkedIndices.length}/{order.items.length} Ready)</span>
                    <span className="text-[10px] font-normal lowercase text-[#8b978f]">Tap item to tick off</span>
                  </div>

                  {order.items.map((item, idx) => {
                    const isChecked = checkedIndices.includes(idx);

                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleDishItem(order.id, idx)}
                        className={`flex items-start justify-between text-xs py-1.5 px-2.5 rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#e3ede8]/60 text-[#8b978f]'
                            : 'bg-[#f4f5f0] text-[#1b2620] hover:bg-[#e3ede8]/30'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1 pr-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by row click
                            className="mt-0.5 accent-[#1f4d3e] rounded w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <span
                              className={`font-extrabold mr-1.5 ${
                                isChecked ? 'line-through text-[#8b978f]' : 'text-[#1b2620]'
                              }`}
                            >
                              {item.quantity}x
                            </span>
                            <span
                              className={`font-bold ${
                                isChecked ? 'line-through text-[#8b978f]' : 'text-[#1b2620]'
                              }`}
                            >
                              {item.name}
                            </span>
                            {item.variantLabel && (
                              <span className="ml-1 text-[10px] font-semibold text-[#1f4d3e] bg-[#e3ede8] px-1.5 py-0.2 rounded">
                                {item.variantLabel}
                              </span>
                            )}
                            {item.specialInstructions && (
                              <p className="text-[11px] font-bold text-[#c8791f] mt-0.5">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>

                        <span className="font-semibold text-right shrink-0">
                          {formatCurrency(item.unitPrice * item.quantity, settings.currency)}
                        </span>
                      </div>
                    );
                  })}

                  {order.notes && (
                    <div className="text-[11px] font-semibold text-[#8a540f] bg-[#f7e9d6] p-2 rounded-xl mt-1">
                      Kitchen Note: {order.notes}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="border-t border-[#e2e4dc]/70 pt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-xs">
                    <span className="text-[#8b978f]">Total: </span>
                    <span className="text-sm font-extrabold text-[#143529]">
                      {formatCurrency(order.total, settings.currency)}
                    </span>
                    <span className="text-[10px] text-[#8b978f] ml-1.5">
                      ({order.paymentMethod.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onViewReceipt(order)}
                      className="p-2 rounded-xl border border-[#e2e4dc] hover:bg-gray-100 text-[#4c5a52] transition-colors"
                      title="Print ticket"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {order.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                        className="px-3 py-1.5 rounded-xl bg-[#2c4a83] text-white text-xs font-bold hover:bg-[#203660] transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Tick: Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'ready')}
                        className="px-3 py-1.5 rounded-xl bg-[#1f4d3e] text-white text-xs font-bold hover:bg-[#143529] transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tick: Mark Ready</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Tick: Complete & Deliver</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                      className="p-1.5 rounded-xl border border-[#f6e2de] text-[#b3402f] hover:bg-[#f6e2de] transition-colors"
                      title="Cancel order"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
