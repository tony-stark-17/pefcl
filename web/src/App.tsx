import styled from '@emotion/styled';
import { useExitListener } from '@hooks/useExitListener';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import 'dayjs/locale/sv';
import React, { useEffect, useState } from 'react';
import { useNuiEvent } from 'react-fivem-hooks';
import { useTranslation } from 'react-i18next';
import { Route } from 'react-router-dom';
import './App.css';
import { useConfig } from './hooks/useConfig';
import theme from './utils/theme';
import AccountsView from './views/Accounts/AccountsView';
import Dashboard from './views/dashboard/Dashboard';
import Invoices from './views/Invoices/Invoices';
import ATM from './views/ATM/ATM';
import { BroadcastsWrapper } from '@hooks/useBroadcasts';
import Transfer from './views/transfer/Transfer';
import Transactions from './views/transactions/Transactions';
import Devbar from '@components/DebugBar';
import { GeneralEvents, NUIEvents, UserEvents } from '@typings/Events';
import Deposit from './views/Deposit/Deposit';
import { fetchNui } from '@utils/fetchNui';
import Withdraw from './views/Withdraw/Withdraw';
import { useSetAtom } from 'jotai';
import { accountsAtom, rawAccountAtom } from '@data/accounts';
import { transactionBaseAtom, transactionInitialState } from '@data/transactions';
import CardsView from './views/Cards/CardsView';

dayjs.extend(updateLocale);

const Container = styled.div`
  padding: 4rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  width: 1400px;
  height: 800px;
  overflow: hidden;
  border-radius: 1rem;
  color: ${theme.palette.text.primary};
  background: ${theme.palette.background.default};
`;

const App: React.FC = () => {
  const config = useConfig();
  const setRawAccounts = useSetAtom(rawAccountAtom);
  const setAccounts = useSetAtom(accountsAtom);
  const setTransactions = useSetAtom(transactionBaseAtom);
  const [hasLoaded, setHasLoaded] = useState(process.env.NODE_ENV === 'development');

  useNuiEvent({
    event: UserEvents.Loaded,
    callback: () => {
      console.debug('Loaded user.');
      setHasLoaded(true);
    },
  });

  useNuiEvent({
    event: UserEvents.Unloaded,
    callback: () => {
      console.debug('Unloaded user.');
      fetchNui(GeneralEvents.CloseUI);
      setHasLoaded(false);
      setRawAccounts([]);
      setAccounts([]);
      setTransactions(transactionInitialState);
    },
  });

  useEffect(() => {
    fetchNui(NUIEvents.Loaded);
    return () => {
      fetchNui(NUIEvents.Unloaded);
    };
  }, []);

  const { data: isVisible } = useNuiEvent<boolean>({
    event: 'setVisible',
    defaultValue: false,
  });

  const { data: isAtmVisible } = useNuiEvent<boolean>({
    event: 'setVisibleATM',
    defaultValue: false,
  });

  const { i18n } = useTranslation();
  useExitListener(isVisible);

  useEffect(() => {
    i18n.changeLanguage(config?.general?.language).catch((e) => console.error(e));
  }, [i18n, config]);

  useEffect(() => {
    dayjs.locale(config?.general?.language ?? 'en');
  }, [i18n, config]);

  if (!hasLoaded) {
    return null;
  }

  return (
    <>
      {process.env.NODE_ENV === 'development' && <Devbar />}

      <React.Suspense fallback={'Loading bank'}>
        {!isAtmVisible && isVisible && (
          <Container>
            <Content>
              <Route path="/" exact component={Dashboard} />
              <Route path="/accounts" component={AccountsView} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/invoices" component={Invoices} />
              <Route path="/transfer" component={Transfer} />
              <Route path="/deposit" component={Deposit} />
              <Route path="/withdraw" component={Withdraw} />
              <Route path="/cards" component={CardsView} />
            </Content>
          </Container>
        )}
      </React.Suspense>

      <React.Suspense fallback={null}>
        <ATM />
      </React.Suspense>

      {/* We don't need to show any fallback for the update component since it doesn't render anything anyway. */}
      <React.Suspense fallback={null}>{<BroadcastsWrapper />}</React.Suspense>
    </>
  );
};

export default App;
