<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Inertia page components
    |--------------------------------------------------------------------------
    |
    | The components rendered for each device-auth page. Change these if you
    | publish the pages somewhere other than resources/js/pages/device-auth.
    |
    */

    'pages' => [
        'verify' => 'device-auth/verify',
        'confirm' => 'device-auth/confirm',
        'admin_index' => 'device-auth/admin/index',
        'admin_show' => 'device-auth/admin/show',
    ],

    /*
    |--------------------------------------------------------------------------
    | Shared prop
    |--------------------------------------------------------------------------
    |
    | Name of the Inertia prop holding the device-auth state on every page
    | (usePage().props.deviceAuth). Set to null to share nothing.
    |
    */

    'shared_prop' => 'deviceAuth',

];
