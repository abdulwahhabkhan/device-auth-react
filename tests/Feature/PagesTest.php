<?php

declare(strict_types=1);

namespace AbdulWahhabKhan\DeviceAuth\React\Tests\Feature;

use AbdulWahhabKhan\DeviceAuth\DeviceAuth;
use AbdulWahhabKhan\DeviceAuth\Enums\DeviceStatus;
use AbdulWahhabKhan\DeviceAuth\React\Tests\TestCase;
use Illuminate\Filesystem\Filesystem;
use Inertia\Testing\AssertableInertia as Assert;

final class PagesTest extends TestCase
{
    public function test_the_verify_page_is_rendered_with_inertia(): void
    {
        $this->actingAs($this->user(['name' => 'Priya']))
            ->get(route('device-auth.verify'))
            ->assertOk()
            ->assertHeader('Accept-CH')
            ->assertInertia(static fn (Assert $page): Assert => $page
                ->component('device-auth/verify')
                ->where('user.name', 'Priya')
                ->where('urls.verify', route('device-auth.verify.store'))
                ->where('urls.requestOptions', route('device-auth.request.options'))
                ->has('contact')
                ->where('deviceAuth.device', null)
                ->where('deviceAuth.enabled', true));
    }

    public function test_the_confirm_page_shows_the_current_device(): void
    {
        $user = $this->user();
        $device = $this->device(['status' => DeviceStatus::Active, 'name' => 'Front desk']);

        $this->onDevice($user, $device)
            ->get(route('device-auth.confirm'))
            ->assertOk()
            ->assertInertia(static fn (Assert $page): Assert => $page
                ->component('device-auth/confirm')
                ->where('device.name', 'Front desk')
                ->where('device.reference', $device->reference())
                ->where('urls.confirm', route('device-auth.confirm.store'))
                ->where('deviceAuth.device.id', $device->id));
    }

    public function test_the_admin_index_lists_devices_of_one_status(): void
    {
        $admin = $this->user(['is_superadmin' => true]);
        $current = $this->device(['status' => DeviceStatus::Active, 'name' => 'Admin PC']);
        $this->device(['name' => 'Ward tablet']);

        $this->onDevice($admin, $current)
            ->get(route('device-auth.admin.index'))
            ->assertOk()
            ->assertInertia(static fn (Assert $page): Assert => $page
                ->component('device-auth/admin/index')
                ->where('status', 'pending')
                ->where('counts.pending', 1)
                ->where('counts.active', 1)
                ->where('devices.total', 1)
                ->where('devices.per_page', 20)
                ->where('devices.data.0.name', 'Ward tablet')
                ->where('deviceAuth.isAdmin', true)
                ->where('deviceAuth.pendingCount', 1));
    }

    public function test_the_admin_show_page_has_details_and_review_urls(): void
    {
        $admin = $this->user(['is_superadmin' => true]);
        $current = $this->device(['status' => DeviceStatus::Active, 'name' => 'Admin PC']);
        $pending = $this->device(['name' => 'Ward tablet']);

        $this->onDevice($admin, $current)
            ->get(route('device-auth.admin.show', $pending))
            ->assertOk()
            ->assertInertia(static fn (Assert $page): Assert => $page
                ->component('device-auth/admin/show')
                ->where('device.reference', $pending->reference())
                ->where('device.is_current', false)
                ->has('logins', 0)
                ->where('urls.approve', route('device-auth.admin.approve', $pending)));
    }

    public function test_page_components_can_be_renamed_in_config(): void
    {
        config(['device-auth-react.pages.verify' => 'auth/verify-device']);

        $this->actingAs($this->user())
            ->get(route('device-auth.verify'))
            ->assertInertia(static fn (Assert $page): Assert => $page->component('auth/verify-device'));
    }

    public function test_review_conflicts_come_back_as_a_device_error_for_inertia(): void
    {
        $admin = $this->user(['is_superadmin' => true]);
        $current = $this->device(['status' => DeviceStatus::Active, 'name' => 'Admin PC']);
        $active = $this->device(['status' => DeviceStatus::Active, 'name' => 'Ward tablet']);

        $this->onDevice($admin, $current)
            ->from(route('device-auth.admin.show', $active))
            ->post(route('device-auth.admin.approve', $active), ['name' => 'Ward tablet'], ['X-Inertia' => 'true'])
            ->assertRedirect(route('device-auth.admin.show', $active))
            ->assertSessionHasErrors('device');

        $pending = $this->device(['name' => 'Spare laptop']);

        $this->onDevice($admin, $current)
            ->from(route('device-auth.admin.show', $pending))
            ->post(route('device-auth.admin.approve', $pending), ['name' => 'Spare laptop'], ['X-Inertia' => 'true'])
            ->assertRedirect(route('device-auth.admin.show', $pending))
            ->assertSessionHas(DeviceAuth::SESSION_FLASH);
    }

    public function test_install_publishes_the_pages(): void
    {
        $this->artisan('device-auth:react-install')->assertSuccessful();

        try {
            $this->assertFileExists(resource_path('js/pages/device-auth/verify.tsx'));
            $this->assertFileExists(resource_path('js/device-auth/types.ts'));
            $this->assertFileExists(config_path('device-auth-react.php'));
        } finally {
            $files = new Filesystem;
            $files->deleteDirectory(resource_path('js/pages/device-auth'));
            $files->deleteDirectory(resource_path('js/device-auth'));
            $files->delete(config_path('device-auth-react.php'));
        }
    }
}
