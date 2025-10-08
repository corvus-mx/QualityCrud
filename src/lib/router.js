export class Router {
  constructor(routes, container) {
    this.routes = routes;
    this.container = container;
    this.currentRoute = null;
    this.params = null;
  }

  async navigate(routeName, params = null) {
    this.currentRoute = routeName;
    this.params = params;

    const route = this.routes[routeName];
    if (!route) {
      this.container.innerHTML = '<div class="text-red-500 font-bold">Route not found</div>';
      return;
    }

    this.container.innerHTML = '<div class="text-center py-12"><div class="text-4xl">⏳</div><p class="text-lg text-gray-600 mt-2">Loading...</p></div>';

    try {
      const content = await route(params);
      this.container.innerHTML = content;
    } catch (error) {
      console.error('Route error:', error);
      this.container.innerHTML = `
        <div class="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p class="text-red-700 font-semibold">Error loading page</p>
          <p class="text-sm text-red-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  refresh() {
    this.navigate(this.currentRoute, this.params);
  }
}
