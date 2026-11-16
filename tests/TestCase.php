<?php

declare(strict_types=1);

namespace AbdulWahhabKhan\DeviceAuth\React\Tests;

use AbdulWahhabKhan\DeviceAuth\DeviceAuth;
use AbdulWahhabKhan\DeviceAuth\DeviceAuthServiceProvider;
use AbdulWahhabKhan\DeviceAuth\Enums\DeviceStatus;
use AbdulWahhabKhan\DeviceAuth\Models\Device;
use AbdulWahhabKhan\DeviceAuth\React\DeviceAuthReactServiceProvider;
use AbdulWahhabKhan\DeviceAuth\React\Tests\Support\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\ServiceProvider as InertiaServiceProvider;
use Orchestra\Testbench\TestCase as Orchestra;

abstract class TestCase extends Orchestra
{
    use RefreshDatabase;

    protected function getPackageProviders($app): array
    {
        return [InertiaServiceProvider::class, DeviceAuthServiceProvider::class, DeviceAuthReactServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('auth.providers.users.model', User::class);
        $app['config']->set('device-auth.rp_id', 'localhost');
        $app['config']->set('device-auth.home', '/dashboard');
        $app['config']->set('app.url', 'https://localhost');
        $app['config']->set('inertia.testing.ensure_pages_exist', false);
        $app['view']->addLocation(__DIR__.'/Support/views');
    }

    protected function defineDatabaseMigrations(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('is_superadmin')->default(false);
            $table->timestamps();
        });
    }

    protected function defineRoutes($router): void
    {
        Route::middleware(['web', 'auth', 'device.verified'])->get('/dashboard', fn (): string => 'dashboard');
        Route::middleware('web')->get('/login', fn (): string => 'login')->name('login');
    }

    /** @param array<string, mixed> $attributes */
    protected function user(array $attributes = []): User
    {
        return User::query()->create($attributes + [
            'name' => 'Priya Shah',
            'email' => uniqid().'@example.test',
            'password' => bcrypt('password'),
        ]);
    }

    /** @param array<string, mixed> $attributes */
    protected function device(array $attributes = []): Device
    {
        return Device::query()->create($attributes + [
            'name' => 'Reception PC',
            'status' => DeviceStatus::Pending,
            'credential_id' => bin2hex(random_bytes(16)),
            'public_key' => 'test',
            'request_ip' => '10.0.0.5',
        ]);
    }

    protected function onDevice(User $user, Device $device): static
    {
        return $this->actingAs($user)->withSession([
            DeviceAuth::SESSION_DEVICE => $device->id,
            DeviceAuth::SESSION_USER => (string) $user->id,
            DeviceAuth::SESSION_CONFIRMED_AT => now()->getTimestamp(),
        ]);
    }
}
