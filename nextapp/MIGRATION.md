# Migration Guide

This document provides guidance for migrating from the legacy React application to the new Next.js application.

## Overview

The migration involves:

1. Moving from a custom React setup to Next.js with App Router
2. Replacing MobX and Redux with React Context and hooks
3. Replacing direct API calls with TanStack Query
4. Converting CSS to Tailwind CSS
5. Modernizing component organization

## Directory Structure Changes

| Legacy Structure | New Structure |
|-----------------|---------------|
| `ui/components/` | `src/components/` |
| `ui/views/` | `src/app/` |
| `ui/stores/` | `src/context/` |
| `ui/utils/` | `src/lib/` |
| `ui/api/` | `src/api/` |

## State Management Changes

### Before (MobX/Redux)

```jsx
// Legacy code with MobX
import { observer } from 'mobx-react';
import store from 'stores/mainStore';

const Component = observer(() => {
  return <div>{store.data}</div>;
});
```

### After (React Context)

```jsx
// New code with React Context
import { useData } from '@/context/DataContext';

const Component = () => {
  const { data } = useData();
  return <div>{data}</div>;
};
```

## API Call Changes

### Before (Direct Fetch)

```jsx
// Legacy code with direct fetch
useEffect(() => {
  fetch('api/data')
    .then(res => res.json())
    .then(data => setData(data))
    .catch(error => console.error(error));
}, []);
```

### After (TanStack Query)

```jsx
// New code with TanStack Query
import { useQuery } from '@tanstack/react-query';
import api from '@/api/api';

const { data, isLoading, error } = useQuery({
  queryKey: ['data'],
  queryFn: api.getData
});
```

## CSS Changes

### Before (Custom CSS)

```jsx
// Legacy code with custom CSS
import './styles.css';

const Component = () => {
  return <div className="container">Content</div>;
};
```

### After (Tailwind CSS)

```jsx
// New code with Tailwind CSS
const Component = () => {
  return <div className="container mx-auto p-4">Content</div>;
};
```

## Migration Process

1. **Setup**: Create the new Next.js project structure
2. **API Client**: Implement the API client with the same endpoints
3. **Context**: Create context providers to replace stores
4. **Components**: Migrate components one by one
5. **Pages**: Create pages in the App Router
6. **Testing**: Test each feature thoroughly

## Migration Script

A migration script is provided to help with copying static assets and generating a report of files that need to be manually migrated:

```bash
npm run migrate
```

## Common Issues and Solutions

### Issue: Component relies on MobX store
**Solution**: Use the DataContext provider and useData hook

### Issue: Component uses direct API calls
**Solution**: Replace with appropriate TanStack Query hook from useQueries.ts

### Issue: Component uses custom CSS
**Solution**: Convert to Tailwind CSS classes

### Issue: Component uses jQuery for DOM manipulation
**Solution**: Refactor to use React state and refs

## Testing Checklist

- [ ] Dashboard displays correctly
- [ ] Node view visualization works
- [ ] Catalog filtering and sorting works
- [ ] Trace view shows logs correctly
- [ ] SDK info page displays documentation
- [ ] URL hash state management works
- [ ] API calls succeed with correct parameters
- [ ] Responsive design works on all screen sizes

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Context Documentation](https://react.dev/reference/react/createContext) 