import { NbMenuItem } from '@nebular/theme';
import { environment } from '../../environments/environment';
import { isPaymentServer } from '../../app-configuration';

export const MENU_ITEMS: NbMenuItem[] = [ 
  
  {
    title: 'Tournaments',
    icon: 'fa fa-trophy',
    link: '/tournaments',
    home: true,
  }, 
  {
    title: 'Users',
    icon: 'fa fa-user',
    link: '/users',
    home: true,
  }, 
  
  {
    title: 'Tables',
    icon: 'fa fa-table',
    link: '/tables'
  }, 
  {
    title: 'Game History',
    icon: 'fa fa-gamepad',
    link: '/game-history'
  }, 
  {
    title: 'Payments',
    icon: 'fa fa-money-check-alt',
    link: '/payments'
  }
];
if(isPaymentServer){
  MENU_ITEMS.push(...[
    
    
    {
      title: 'Currency Config',
      icon: 'fa fa-cog',
      link: '/payment-server/currency-config'
    }, 
    {
      title: 'Deposit Addresses',
      icon: 'fa fa-money-check-alt',
      link: '/payment-server/deposit-addresses'
    },
    {
      title: 'Settings',
      icon: 'fa fa-cog',
      link: '/payment-server/settings'
    }, 
    {
      title: 'Hooks',
      icon: 'fa fa-angle-double-right',
      link: '/payment-server/hooks'
    }
  ])
}else{
  //MENU_ITEMS.push( )
}

