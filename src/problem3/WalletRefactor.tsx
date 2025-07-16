interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

interface Props extends BoxProps {}

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo' | string;

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const getPriority = (blockchain: Blockchain): number => {
    switch (blockchain) {
      case 'Osmosis': return 100;
      case 'Ethereum': return 50;
      case 'Arbitrum': return 30;
      case 'Zilliqa':
      case 'Neo': return 20;
      default: return -99;
    }
  };

  const sortedBalances = useMemo(() => {
    return [...balances]
      .filter((balance) =>
        getPriority(balance.blockchain) > -99 && balance.amount > 0
      )
      .sort((a, b) =>
        getPriority(b.blockchain) - getPriority(a.blockchain)
      );
  }, [balances]);

  const formattedBalances: FormattedWalletBalance[] = useMemo(() =>
    sortedBalances.map((balance) => ({
      ...balance,
      formatted: balance.amount.toFixed(2),
    })), [sortedBalances]
  );

  const rows = formattedBalances.map((balance) => {
    const usdValue = prices[balance.currency] * balance.amount || 0;
    return (
      <WalletRow
        className={classes.row}
        key={balance.currency}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    );
  });

  return (
    <div {...rest}>
      {rows}
    </div>
  );
};
