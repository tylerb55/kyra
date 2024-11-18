function Container({ children, display="block", padding="0" }) {
    return (
        <div className={`container display-${display} padding-${padding}`}>
        {children}
        </div>
    );
}
export default Container;