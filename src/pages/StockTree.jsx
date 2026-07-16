import { useItems } from '../hooks/useItems';
import { StockTreeView } from '../components/Stock/StockTreeView';
import { PageContainer, PageHeader, PageSkeleton } from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';
import { LOW_STOCK_THRESHOLD } from '../lib/stockAlerts';

export function StockTree() {
  const { items, loading } = useItems();

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Stock by vehicle"
        subtitle={`Make and model tree with unit totals and low-stock parts (below ${LOW_STOCK_THRESHOLD} units)`}
      />

      <Card className="p-4 sm:p-6">
        <StockTreeView items={items} />
      </Card>
    </PageContainer>
  );
}
