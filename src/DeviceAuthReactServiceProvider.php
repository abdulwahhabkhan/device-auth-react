<?php

declare(strict_types=1);

namespace AbdulWahhabKhan\DeviceAuth\React;

use AbdulWahhabKhan\DeviceAuth\Data\PageData;
use AbdulWahhabKhan\DeviceAuth\DeviceAuth;
use AbdulWahhabKhan\DeviceAuth\React\Console\InstallCommand;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * Renders the device-auth pages with Inertia + React and shares the
 * device-auth state with every page.
 */
final class DeviceAuthReactServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/device-auth-react.php', 'device-auth-react');
    }

    public function boot(): void
    {
        DeviceAuth::verifyView($this->page('verify'));
        DeviceAuth::confirmView($this->page('confirm'));
        DeviceAuth::deviceIndexView($this->page('admin_index'));
        DeviceAuth::deviceShowView($this->page('admin_show'));

        $this->shareState();

        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../config/device-auth-react.php' => config_path('device-auth-react.php'),
            ], 'device-auth-react-config');

            // Pages land where Inertia looks for them; shared code next to them.
            $this->publishes([
                __DIR__.'/../resources/js/pages/device-auth' => resource_path('js/pages/device-auth'),
                __DIR__.'/../resources/js/device-auth' => resource_path('js/device-auth'),
            ], 'device-auth-react');

            $this->commands([InstallCommand::class]);
        }
    }

    /** Inertia component name for a page key, from config. */
    public static function component(string $page): string
    {
        $component = config('device-auth-react.pages.'.$page);

        return is_string($component) && $component !== '' ? $component : 'device-auth/'.str_replace('_', '/', $page);
    }

    /**
     * @return Closure(Request, PageData): Response
     */
    private function page(string $page): Closure
    {
        return static fn (Request $request, PageData $data): Response => Inertia::render(self::component($page), $data->toArray())
            ->toResponse($request);
    }

    private function shareState(): void
    {
        $prop = config('device-auth-react.shared_prop', 'deviceAuth');

        if (! is_string($prop) || $prop === '') {
            return;
        }

        Inertia::share($prop, static fn (): ?array => DeviceAuth::state()?->toArray());
    }
}
