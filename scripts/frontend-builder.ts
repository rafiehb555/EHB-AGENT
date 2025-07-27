import fs from 'fs';
import path from 'path';

interface ComponentConfig {
  name: string;
  type: 'dashboard' | 'card' | 'form' | 'table' | 'search';
  service: string;
  props: string[];
  features: string[];
  sqlLevel: string;
}

class FrontendBuilderAgent {
  private componentsPath: string;
  private servicesPath: string;
  private stylesPath: string;

  constructor() {
    this.componentsPath = path.join(__dirname, '../frontend/components');
    this.servicesPath = path.join(__dirname, '../frontend/services');
    this.stylesPath = path.join(__dirname, '../frontend/styles');
    this.ensureDirectories();
  }

  private ensureDirectories() {
    [this.componentsPath, this.servicesPath, this.stylesPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  public generateComponent(config: ComponentConfig): string {
    const componentCode = this.buildComponentCode(config);
    const filePath = path.join(this.componentsPath, `${config.name}.tsx`);
    
    fs.writeFileSync(filePath, componentCode);
    console.log(`✅ Component generated: ${filePath}`);
    
    return filePath;
  }

  private buildComponentCode(config: ComponentConfig): string {
    const imports = this.getImports(config);
    const props = this.getProps(config);
    const componentBody = this.getComponentBody(config);
    
    return `import React from 'react';
${imports}

interface ${config.name}Props {
${props}
}

export default function ${config.name}({ ${config.props.join(', ')} }: ${config.name}Props) {
${componentBody}
}`;
  }

  private getImports(config: ComponentConfig): string {
    const imports = ['React'];
    
    if (config.type === 'dashboard') {
      imports.push('useState', 'useEffect');
    }
    
    if (config.type === 'form') {
      imports.push('useState', 'useForm');
    }
    
    if (config.type === 'table') {
      imports.push('useState');
    }
    
    return imports.map(imp => `import { ${imp} } from 'react';`).join('\n');
  }

  private getProps(config: ComponentConfig): string {
    const baseProps = [
      'title?: string',
      'description?: string',
      'className?: string'
    ];
    
    switch (config.type) {
      case 'dashboard':
        return [
          ...baseProps,
          'data?: any[]',
          'loading?: boolean',
          'error?: string'
        ].join('\n  ');
        
      case 'card':
        return [
          ...baseProps,
          'image?: string',
          'price?: number',
          'status?: string'
        ].join('\n  ');
        
      case 'form':
        return [
          ...baseProps,
          'onSubmit?: (data: any) => void',
          'initialData?: any'
        ].join('\n  ');
        
      case 'table':
        return [
          ...baseProps,
          'columns?: string[]',
          'data?: any[]',
          'onRowClick?: (row: any) => void'
        ].join('\n  ');
        
      default:
        return baseProps.join('\n  ');
    }
  }

  private getComponentBody(config: ComponentConfig): string {
    switch (config.type) {
      case 'dashboard':
        return this.getDashboardBody(config);
      case 'card':
        return this.getCardBody(config);
      case 'form':
        return this.getFormBody(config);
      case 'table':
        return this.getTableBody(config);
      case 'search':
        return this.getSearchBody(config);
      default:
        return this.getDefaultBody(config);
    }
  }

  private getDashboardBody(config: ComponentConfig): string {
    return `  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch dashboard data
    setLoading(true);
    // API call here
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div role="presentation" className="flex items-center justify-center p-8" role="presentation">
        <div role="presentation" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="presentation"></div>
      </div>
    );
  }

  return (
    <div role="presentation" className="p-6 bg-white rounded-lg shadow-sm" role="presentation">
      <div role="presentation" className="flex items-center justify-between mb-6" role="presentation">
        <h1 role="heading" className="text-2xl font-bold text-gray-900">${config.name}</h1>
        <SQLBadge level="${config.sqlLevel}" />
      </div>
      
      <div role="presentation" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="presentation">
        {data.map((item, index) => (
          <DashboardCard
            key={index}
            title={item.title}
            description={item.description}
            level={item.level}
          />
        ))}
      </div>
    </div>
  );`;
  }

  private getCardBody(config: ComponentConfig): string {
    return `  return (
    <div role="presentation" className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow" role="presentation">
      {image && (
        <img aria-label="Image" 
          src={image} 
          alt={title} 
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      )}
      
      <h3 role="heading" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p role="text" className="text-sm text-gray-600 mb-3">{description}</p>
      
      {status && (
        <span role="text" className="inline-block px-2 py-1 text-xs font-medium rounded-full ${
          status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }">
          {status}
        </span>
      )}
    </div>
  );`;
  }

  private getFormBody(config: ComponentConfig): string {
    return `  const [formData, setFormData] = useState(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div role="presentation" role="presentation">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) = aria-label="Input field"> handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div role="presentation" role="presentation">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
       aria-label="Button">
        Submit
      </button>
    </form>
  );`;
  }

  private getTableBody(config: ComponentConfig): string {
    return `  return (
    <div role="presentation" className="bg-white rounded-lg shadow-sm border overflow-hidden" role="presentation">
      <div role="presentation" className="px-6 py-4 border-b border-gray-200" role="presentation">
        <h3 role="heading" className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      
      <div role="presentation" className="overflow-x-auto" role="presentation">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns?.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );`;
  }

  private getSearchBody(config: ComponentConfig): string {
    return `  const [query, setQuery] = useState('');

  const handleSearch = (value: string) => {
    setQuery(value);
    // Implement search logic here
  };

  return (
    <div role="presentation" className="relative" role="presentation">
      <input
        type="text"
        value={query}
        onChange={(e) = aria-label="Input field"> handleSearch(e.target.value)}
        placeholder="Search ${config.service}..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div role="presentation" className="absolute right-3 top-1/2 transform -translate-y-1/2" role="presentation">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );`;
  }

  private getDefaultBody(config: ComponentConfig): string {
    return `  return (
    <div role="presentation" className="p-4 bg-white rounded-lg shadow-sm border" role="presentation">
      <h3 role="heading" className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p role="text" className="text-sm text-gray-600">{description}</p>
      <SQLBadge level="${config.sqlLevel}" />
    </div>
  );`;
  }

  public generateDashboard(service: string, config: any): string {
    const dashboardCode = this.buildDashboardCode(service, config);
    const servicePath = path.join(this.servicesPath, service);
    
    if (!fs.existsSync(servicePath)) {
      fs.mkdirSync(servicePath, { recursive: true });
    }
    
    const filePath = path.join(servicePath, 'Dashboard.tsx');
    fs.writeFileSync(filePath, dashboardCode);
    
    console.log(`✅ Dashboard generated: ${filePath}`);
    return filePath;
  }

  private buildDashboardCode(service: string, config: any): string {
    return `import React, { useState, useEffect } from 'react';
import DashboardCard from '../../components/DashboardCard';
import SQLBadge from '../../components/SQLBadge';
import SearchBar from '../../components/SearchBar';

interface ${service}DashboardProps {
  userLevel: string;
  data?: any[];
}

export default function ${service}Dashboard({ userLevel, data = [] }: ${service}DashboardProps) {
  const [filteredData, setFilteredData] = useState(data);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleSearch = (query: string) => {
    const filtered = data.filter(item => 
      item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredData(filtered);
  };

  if (loading) {
    return (
      <div role="presentation" className="flex items-center justify-center p-8" role="presentation">
        <div role="presentation" className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="presentation"></div>
      </div>
    );
  }

  return (
    <div role="presentation" className="p-6 bg-gray-50 min-h-screen" role="presentation">
      <div role="presentation" className="max-w-7xl mx-auto" role="presentation">
        <div role="presentation" className="flex items-center justify-between mb-6" role="presentation">
          <div role="presentation" role="presentation">
            <h1 role="heading" className="text-3xl font-bold text-gray-900">${service} Dashboard</h1>
            <p role="text" className="text-gray-600">Manage your ${service.toLowerCase()} services</p>
          </div>
          <SQLBadge level={userLevel} />
        </div>
        
        <div role="presentation" className="mb-6" role="presentation">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        <div role="presentation" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" role="presentation">
          {filteredData.map((item, index) => (
            <DashboardCard
              key={index}
              title={item.title}
              description={item.description}
              level={item.level || userLevel}
              image={item.image}
              price={item.price}
              status={item.status}
            />
          ))}
        </div>
        
        {filteredData.length === 0 && (
          <div role="presentation" className="text-center py-12" role="presentation">
            <p role="text" className="text-gray-500">No ${service.toLowerCase()} items found</p>
          </div>
        )}
      </div>
    </div>
  );
}`;
  }

  public generateSQLBadge(): string {
    const badgeCode = `import React from 'react';

interface SQLBadgeProps {
  level: string;
  className?: string;
}

const SQLBadge: React.FC<SQLBadgeProps> = ({ level, className = '' }) => {
  const getBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'free':
        return 'bg-gray-100 text-gray-800';
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-yellow-100 text-yellow-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span role="text" className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getBadgeColor(level)} \${className}\`}>
      {level} SQL
    </span>
  );
};

export default SQLBadge;`;

    const filePath = path.join(this.componentsPath, 'SQLBadge.tsx');
    fs.writeFileSync(filePath, badgeCode);
    
    console.log(`✅ SQLBadge component generated: ${filePath}`);
    return filePath;
  }

  public generateSearchBar(): string {
    const searchCode = `import React from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Search...", 
  className = '' 
}) => {
  const [query, setQuery] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div role="presentation" className={\`relative \${className}\`} role="presentation">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      / aria-label="Input field">
      <div role="presentation" className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" role="presentation">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;`;

    const filePath = path.join(this.componentsPath, 'SearchBar.tsx');
    fs.writeFileSync(filePath, searchCode);
    
    console.log(`✅ SearchBar component generated: ${filePath}`);
    return filePath;
  }

  public generateServiceComponents(service: string): void {
    const components = [
      { name: 'DashboardCard', type: 'card' as const },
      { name: 'SearchBar', type: 'search' as const },
      { name: 'SQLBadge', type: 'card' as const }
    ];

    components.forEach(component => {
      this.generateComponent({
        name: component.name,
        type: component.type,
        service,
        props: ['title', 'description'],
        features: ['responsive', 'hover-effects'],
        sqlLevel: 'Normal'
      });
    });

    this.generateDashboard(service, {});
  }
}

export default FrontendBuilderAgent; 