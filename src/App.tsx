import './App.css';
import axios from 'axios';
import React from 'react';
import {
  useState,
  useEffect,
  useTransition,
  useMemo,
  useCallback,
} from 'react';

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
  onChange: (v: string) => void;
  isPending: boolean;
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {isPending && (
        <span style={{ marginLeft: 8 }} aria-live="polite">
          Loading…
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
  onToggleLike: (id: number) => void;
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
            alt={product.title}
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

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedSet, setLikedSet] = useState<Set<number>>(() => new Set());

  const onToggleLike = useCallback((id: number) => {
    setLikedSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [prodRes, userRes] = await Promise.all([
          axios.get('https://dummyjson.com/products?limit=200'),
          axios.get('https://dummyjson.com/users?limit=200'),
        ]);
        if (!mounted) return;
        if (prodRes.status === 200 && userRes.status === 200) {
          setProducts(prodRes.data.products ?? []);
          setUsers(userRes.data.users ?? []);
        } else {
          throw new Error(`HTTP ${prodRes.status}/${userRes.status}`);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
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
      return products.map(p => ({ ...p, user: userMap.get(p.id) }));
    }
    return products
      .filter(p => {
        const u = userMap.get(p.id);
        return (
          p.title.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          (u &&
            (u.firstName.toLowerCase().includes(kw) ||
              u.lastName.toLowerCase().includes(kw)))
        );
      })
      .map(p => ({ ...p, user: userMap.get(p.id) }));
  }, [products, userMap, query]);

  if (isLoading) {
    return (
      <div style={{ padding: 16 }}>
        <p>Đang tải dữ liệu…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'red' }}>Lỗi: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <SearchBar
        value={query}
        onChange={handleSearchChange}
        isPending={isPending}
      />

      {filteredProducts.length === 0 ? (
        <p>Không tìm thấy kết quả phù hợp.</p>
      ) : (
        filteredProducts.map(p => (
          <ProductItem
            key={p.id}
            product={p}
            user={p.user}
            liked={likedSet.has(p.id)}
            onToggleLike={onToggleLike}
          />
        ))
      )}
    </div>
  );
}

export default App;
