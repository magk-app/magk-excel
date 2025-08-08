/**
 * Test Discovery Service Demo Component
 * Demonstrates comprehensive usage of the TestDiscoveryService for developer test panel
 */

import React, { useState, useEffect } from 'react';
import { 
  useTestDiscovery, 
  TestFileInfo, 
  TestCategory, 
  TestSearchOptions 
} from '../services/testDiscoveryService';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Progress } from './ui/progress';

export const TestDiscoveryDemo: React.FC = () => {
  const testDiscovery = useTestDiscovery();
  
  const [tests, setTests] = useState<TestFileInfo[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [stats, setStats] = useState<any>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<TestFileInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHotReloadEnabled, setIsHotReloadEnabled] = useState<boolean>(false);

  // Initialize discovery on component mount
  useEffect(() => {
    handleDiscoverTests();
  }, []);

  const handleDiscoverTests = async () => {
    setIsLoading(true);
    try {
      const result = await testDiscovery.discoverTestFiles(true);
      if (result.success) {
        setTests(result.tests);
        setCategories(result.categories);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to discover tests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const searchOptions: TestSearchOptions = {
        query: searchQuery || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy: 'name',
        sortOrder: 'asc'
      };
      
      const filteredTests = await testDiscovery.searchTests(searchOptions);
      setTests(filteredTests);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryFilter = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsLoading(true);
    try {
      if (categoryId === 'all') {
        const allTests = await testDiscovery.listAllTests();
        setTests(allTests);
      } else {
        const categoryTests = await testDiscovery.getTestsByCategory(categoryId);
        setTests(categoryTests);
      }
    } catch (error) {
      console.error('Category filter failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSelect = async (testId: string) => {
    try {
      const testDetails = await testDiscovery.getTestDetails(testId);
      setSelectedTest(testDetails);
    } catch (error) {
      console.error('Failed to get test details:', error);
    }
  };

  const handleToggleHotReload = () => {
    if (isHotReloadEnabled) {
      testDiscovery.disableHotReload();
    } else {
      testDiscovery.enableHotReload();
    }
    setIsHotReloadEnabled(!isHotReloadEnabled);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'deprecated': return 'bg-gray-100 text-gray-800';
      case 'experimental': return 'bg-blue-100 text-blue-800';
      case 'broken': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Discovery Service Demo</h1>
        <div className="flex gap-2">
          <Button onClick={handleToggleHotReload} variant="outline">
            {isHotReloadEnabled ? '🔥 Hot Reload ON' : '❄️ Hot Reload OFF'}
          </Button>
          <Button onClick={handleDiscoverTests} disabled={isLoading}>
            {isLoading ? 'Discovering...' : '🔍 Discover Tests'}
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Test Statistics</CardTitle>
          <CardDescription>Overview of discovered test files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalFiles || 0}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(stats.byType || {}).length}
              </div>
              <div className="text-sm text-gray-600">File Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(stats.byStatus?.active || 0)}
              </div>
              <div className="text-sm text-gray-600">Active Tests</div>
            </div>
          </div>
          
          {/* File Type Breakdown */}
          {stats.byType && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">File Types:</h4>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <Badge key={type} variant="secondary">
                    {type.toUpperCase()}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific test files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryFilter('all')}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Test Files ({tests.length})
                {isLoading && <Progress value={50} className="w-full mt-2" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleTestSelect(test.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-sm">{test.name}</h4>
                        <p className="text-xs text-gray-600 mb-2">{test.filename}</p>
                        {test.description && (
                          <p className="text-xs text-gray-500">{test.description}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge 
                          className={getComplexityColor(test.metadata.complexity)}
                        >
                          {test.metadata.complexity}
                        </Badge>
                        <Badge 
                          className={getStatusColor(test.metadata.status)}
                        >
                          {test.metadata.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mt-2 flex-wrap">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: test.category.color, color: test.category.color }}
                      >
                        {test.category.icon} {test.category.name}
                      </Badge>
                      <Badge variant="outline">{test.type.toUpperCase()}</Badge>
                      <Badge variant="outline">{test.metadata.testType}</Badge>
                    </div>
                    
                    {test.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {test.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                        {test.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{test.tags.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {tests.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    No tests found. Try adjusting your search or filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Details Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Test Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTest ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{selectedTest.name}</h4>
                    <p className="text-sm text-gray-600">{selectedTest.filename}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedTest.description}</p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm">Category</h5>
                    <Badge 
                      style={{ backgroundColor: selectedTest.category.color + '20', color: selectedTest.category.color }}
                    >
                      {selectedTest.category.icon} {selectedTest.category.name}
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-sm">Metadata</h5>
                    <div className="text-xs space-y-1">
                      <div>Type: <Badge variant="outline">{selectedTest.type}</Badge></div>
                      <div>Test Type: <Badge variant="outline">{selectedTest.metadata.testType}</Badge></div>
                      <div>Complexity: <Badge className={getComplexityColor(selectedTest.metadata.complexity)}>
                        {selectedTest.metadata.complexity}
                      </Badge></div>
                      <div>Status: <Badge className={getStatusColor(selectedTest.metadata.status)}>
                        {selectedTest.metadata.status}
                      </Badge></div>
                      <div>Size: {selectedTest.metadata.size} bytes</div>
                    </div>
                  </div>
                  
                  {selectedTest.metadata.dependencies.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm">Dependencies</h5>
                      <div className="text-xs space-y-1">
                        {selectedTest.metadata.dependencies.map((dep, index) => (
                          <div key={index} className="font-mono bg-gray-100 p-1 rounded">
                            {dep}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTest.tags.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm">Tags</h5>
                      <div className="flex gap-1 flex-wrap">
                        {selectedTest.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTest.content && (
                    <div>
                      <h5 className="font-medium text-sm">Preview</h5>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {selectedTest.content.substring(0, 200)}
                        {selectedTest.content.length > 200 && '...'}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a test file to view details
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Available Test Categories</CardTitle>
          <CardDescription>Predefined categories for organizing tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div 
                key={category.id}
                className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryFilter(category.id)}
                style={{ borderColor: category.color + '40' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{category.icon}</span>
                  <h4 className="font-semibold" style={{ color: category.color }}>
                    {category.name}
                  </h4>
                  <Badge variant="outline">
                    {stats.byCategory?.[category.id] || 0}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestDiscoveryDemo;