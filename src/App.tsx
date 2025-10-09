import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react';
import { useState, useTransition, useMemo, useCallback } from 'react';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import AutoSizer from 'react-virtualized-auto-sizer';
import { List, type RowComponentProps } from 'react-window';

type Product = {
  id: number;
  title: string;
  category: string;
  price: number;
  description: string;
  images: string[];
};
type User = {
  id: number;
  firstName: string;
  lastName: string;
};

type ProductWithUser = Product & { user?: User };

const SearchBar = ({
  value,
  onChange,
  isPending,
}: {
  value: string;
  onChange: (_value: string) => void; // Renamed to _value to suppress unused warning
  isPending: boolean;
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <input value={value} onChange={e => onChange(e.target.value)} />
      {isPending && (
        <span style={{ marginLeft: 8 }} aria-live="polite">
          Loading...
        </span>
      )}
    </div>
  );
};

const ProductItem = React.memo(function ProductItem({
  product,
  user,
  liked,
  onToggleLike,
}: {
  product: Product;
  user?: User;
  liked: boolean;
  onToggleLike: (_id: number) => void; // Renamed to _id to suppress unused warning
}) {
  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <h2 style={{ margin: '0 0 8px' }}>{product.title}</h2>
      <p style={{ margin: '0 0 8px' }}>{product.description}</p>

      <div
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}
      >
        {product.images.map(src => (
          <img
            key={src}
            src={src}
            alt={`Image of ${product.title}`}
            style={{
              width: 96,
              height: 96,
              objectFit: 'cover',
              borderRadius: 6,
            }}
          />
        ))}
      </div>

      {user && (
        <p style={{ margin: '0 0 8px', fontStyle: 'italic' }}>
          {user.firstName} {user.lastName}
        </p>
      )}

      <button onClick={() => onToggleLike(product.id)}>
        {liked ? 'Unlike' : 'Like'}
      </button>
    </div>
  );
});

const Row = React.memo(
  ({
    index,
    style,
    items,
    likedSet,
    onToggleLike,
  }: RowComponentProps<{
    items: ProductWithUser[];
    likedSet: Set<number>;
    onToggleLike: (_id: number) => void;
  }>) => {
    const product = items[index];

    return (
      <div style={style}>
        <ProductItem
          product={product}
          user={product.user}
          liked={likedSet.has(product.id)}
          onToggleLike={onToggleLike}
        />
      </div>
    );
  },
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {},
  },
});

function fetchProducts(): Promise<Product[]> {
  return axios
    .get('https://dummyjson.com/products?limit=200')
    .then(res => res.data.products);
}

function fetchUsers(): Promise<User[]> {
  return axios
    .get('https://dummyjson.com/users?limit=200')
    .then(res => res.data.users);
}

function App() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [likedSet, setLikedSet] = useState<Set<number>>(() => new Set());

  const productsQuery = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const usersQuery = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const products = productsQuery.data || [];
  const users = usersQuery.data || [];

  const onToggleLike = useCallback((id: number) => {
    setLikedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const userMap = useMemo(() => {
    const map = new Map<number, User>();
    for (const u of users) map.set(u.id, u);
    return map;
  }, [users]);

  const handleSearchChange = useCallback(
    (val: string) => {
      startTransition(() => setQuery(val));
    },
    [startTransition],
  );

  const filteredProducts: ProductWithUser[] = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) {
      return products.map((p: Product) => ({ ...p, user: userMap.get(p.id) }));
    }
    return products
      .filter((p: Product) => {
        const u = userMap.get(p.id);
        return (
          p.title.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          (u &&
            (u.firstName.toLowerCase().includes(kw) ||
              u.lastName.toLowerCase().includes(kw)))
        );
      })
      .map((p: Product) => ({ ...p, user: userMap.get(p.id) }));
  }, [products, userMap, query]);

  return (
    <div className="App">
      <div className="page">
        <SearchBar
          value={query}
          onChange={handleSearchChange}
          isPending={isPending}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="page">
          <p>No results found.</p>
        </div>
      ) : (
        <div className="listContainer">
          <AutoSizer>
            {({ width, height }) => (
              <div style={{ width, height }}>
                <List
                  rowComponent={Row}
                  rowCount={filteredProducts.length}
                  rowHeight={520}
                  rowProps={{ items: filteredProducts, likedSet, onToggleLike }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}
          </AutoSizer>
        </div>
      )}
    </div>
  );
}

function AppWrapper() {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        onReset={reset}
        fallbackRender={({ error, resetErrorBoundary }) => (
          <div>
            <p>Something went wrong: {error.message}</p>
            <button onClick={resetErrorBoundary}>Try again</button>
          </div>
        )}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default AppWrapper;
